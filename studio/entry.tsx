import { Badge } from "@hublead-io/ui-kit/components/badge"
import { SidebarContext, type SidebarContextProps } from "@hublead-io/ui-kit/components/sidebar"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@hublead-io/ui-kit/components/tabs"
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { MemoryRouter } from "react-router"
import { noop } from "@/app/previews/noop"
import { createPreviewQueryClient } from "@/app/previews/preview-query-client"
import { sampleJobChangeFilter, sampleJobChanges, sampleMe, samplePeriod } from "@/app/previews/preview-samples"
import { ActivityPage, handle as activityHandle } from "@/app/routes/activity"
import { EnrichmentsPage, handle as enrichmentsHandle } from "@/app/routes/enrichments"
import { handle as jobChangesHandle } from "@/app/routes/job-changes"
import { AppShellHeader, AppShellInset, AppShellMain, appSidebarWidths } from "@/app/shell/app-shell"
import { HubleadHeaderIndicators } from "@/app/shell/header/hublead-indicators"
import { hubleadJobChangesScope as scope } from "@/app/shell/layout/hublead/job-changes-scope"
import { noUnseenFinishedJobs } from "@/app/shell/sidebar/hublead/navigation"
import { HubleadSidebar } from "@/app/shell/sidebar/hublead/sidebar"
import { SidebarFeatureCards } from "@/app/shell/sidebar-cards/feature-cards/sidebar-feature-cards"
import { AlertsButton } from "@/features/job-changes/slack/components/alerts-button"
import { ChangesPanel } from "@/features/job-changes/changes/components/changes-panel"
import { JobChangesScopeContext } from "@/features/job-changes/hooks/use-job-changes-scope"
import type { JobChange } from "@/features/job-changes/model/events"
import { noNewJobChanges } from "@/features/job-changes/model/events"
import { defaultWatchFilter, type JobChangeWatch } from "@/features/job-changes/model/watches"
import { JobChangesOverviewPanel } from "@/features/job-changes/overview/components/job-changes-overview-panel"
import { jobChangesQuery, unreadJobChangesCountQuery } from "@/features/job-changes/queries/events"
import { jobChangeMembersQuery } from "@/features/job-changes/queries/members"
import { jobChangeListsQuery, watchedListsQuery } from "@/features/job-changes/queries/lists"
import { WatchListDialog } from "@/features/job-changes/watch-list/components/watch-list-dialog"
import { PortalContainerProvider } from "@hublead-io/ui-kit/lib/portal-container"
import { slackConnectionQuery } from "@/features/job-changes/queries/slack"
import { jobChangeStatsQuery } from "@/features/job-changes/queries/stats"
import { jobChangeWatchesQuery } from "@/features/job-changes/queries/watches"
import { TeamPanel } from "@/features/job-changes/team/components/team-panel"
import { WatchesPanel } from "@/features/job-changes/watches/components/watches-panel"
import type { CrmProvider } from "@/shared/config/crm"
import { routes } from "@/shared/config/routes"
import { meQuery } from "@/shared/features/me/queries/me"
import { CrmScope } from "@/shared/infra/auth/crm-scope"

export type AppPage = "job-changes" | "activity" | "enrichments"
export type JobChangesTab = "changes" | "watches" | "team"

export type SampleRole = { company: string; title: string; logo?: string }
export type SampleChange = {
  firstName: string
  lastName: string
  photo?: string
  from: SampleRole
  to?: SampleRole | null
  daysAgo?: number
}
export type SampleUser = { firstName: string; lastName: string; email: string; photo?: string }

export type HubleadAppProps = {
  page: AppPage
  crm?: CrmProvider
  tab?: JobChangesTab
  user?: SampleUser
  changes?: SampleChange[]
  stats?: { moved?: number; left?: number; tracked?: number; missingProfiles?: number }
  team?: { name: string; photo?: string; tracked: number; moved: number; left: number }[]
  slack?: boolean
  /** opens a real dialog over the page, inside the app's frame */
  dialog?: "watch-segment" | null
  /** the CRM lists the watch dialog offers */
  lists?: { name: string; size: number }[]
  sidebarCards?: boolean
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
}

const sidebar: SidebarContextProps = {
  state: "expanded",
  open: true,
  setOpen: noop,
  openMobile: false,
  setOpenMobile: noop,
  isMobile: false,
  toggleSidebar: noop,
}

const palette = ["#7D60E8", "#0EA5E9", "#F97316", "#10B981", "#E11D48", "#111827"]

export function letterLogo(name: string): string {
  const color = palette[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % palette.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${color}"/><text x="16" y="22.5" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="800" text-anchor="middle" fill="#fff">${name.slice(0, 1).toUpperCase()}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const day = 86_400_000

function toEvents(changes: SampleChange[]): JobChange[] {
  const now = Date.now()
  return changes.map((c, i) => ({
    id: i + 1,
    contactId: String(i + 1),
    firstName: c.firstName,
    lastName: c.lastName,
    pictureUrl: c.photo ?? "",
    publicIdentifier: `${c.firstName}-${c.lastName}`.toLowerCase(),
    crmUrl: "https://app.hubspot.com",
    mine: true,
    kind: c.to ? "moved" : "left",
    fromCompany: c.from.company,
    fromTitle: c.from.title,
    fromCompanyLogo: c.from.logo ?? letterLogo(c.from.company),
    toCompany: c.to?.company ?? "",
    toTitle: c.to?.title ?? "",
    toCompanyLogo: c.to ? (c.to.logo ?? letterLogo(c.to.company)) : "",
    toStartAt: null,
    detectedAt: new Date(now - (c.daysAgo ?? i + 1) * day).toISOString(),
  }))
}

function toWatches(events: JobChange[]): JobChangeWatch[] {
  const now = Date.now()
  return events.map((e) => ({
    id: e.id,
    contactId: e.contactId,
    firstName: e.firstName,
    lastName: e.lastName,
    pictureUrl: e.pictureUrl,
    publicIdentifier: e.publicIdentifier,
    status: "active",
    intervalMonths: 3,
    source: "segment",
    startsAt: new Date(now - 60 * day).toISOString(),
    nextCheckAt: new Date(now + 30 * day).toISOString(),
    expiresAt: new Date(now + 300 * day).toISOString(),
    lookupsDone: 1,
    lookupsTotal: 4,
    createdBy: "1",
    currentCompany: e.kind === "moved" ? e.toCompany : e.fromCompany,
    currentTitle: e.kind === "moved" ? e.toTitle : e.fromTitle,
    currentCompanyLogo: e.kind === "moved" ? e.toCompanyLogo : e.fromCompanyLogo,
    latestChange: { kind: e.kind, fromCompany: e.fromCompany, toCompany: e.toCompany, toTitle: e.toTitle, detectedAt: e.detectedAt },
    alerts: { on: "any", taskAssignee: "owner", taskEnabled: true, propertiesEnabled: true, slackEnabled: true },
  }))
}

function seed(client: QueryClient, props: HubleadAppProps): void {
  const events = props.changes ? toEvents(props.changes) : sampleJobChanges.events
  client.setQueryData(jobChangesQuery(scope, sampleJobChangeFilter, 0).queryKey, { hasMore: false, events })
  client.setQueryData(unreadJobChangesCountQuery(scope).queryKey, 0)
  client.setQueryData(jobChangeWatchesQuery(scope, defaultWatchFilter, 0).queryKey, { hasMore: false, watches: toWatches(events) })
  client.setQueryData(watchedListsQuery(scope).queryKey, [])
  const lists = props.lists ?? [
    { name: "Customers - Champions", size: 412 },
    { name: "Open deals - Decision makers", size: 268 },
    { name: "Closed lost 2025", size: 1934 },
    { name: "Event leads - SaaStr", size: 157 },
    { name: "Target accounts - Tier 1", size: 846 },
  ]
  client.setQueryData(jobChangeListsQuery(scope, "").queryKey, {
    lists: lists.map((l, i) => ({ id: String(i + 1), name: l.name, size: l.size, isSizeMinimum: false, processingStatus: null })),
    hasMore: false,
    listsUrl: null,
  })
  client.setQueryData(
    slackConnectionQuery(scope).queryKey,
    props.slack === false
      ? { isConnected: false }
      : { isConnected: true, teamName: "Acme", channelName: "job-changes", notifyMoved: true, notifyLeft: true },
  )
  const stats = client.getQueryData(jobChangeStatsQuery(scope).queryKey)
  if (stats)
    client.setQueryData(jobChangeStatsQuery(scope).queryKey, {
      ...stats,
      movedLast30Days: props.stats?.moved ?? stats.movedLast30Days,
      leftLast30Days: props.stats?.left ?? stats.leftLast30Days,
      watches: { ...stats.watches, active: props.stats?.tracked ?? stats.watches.active, not_found: props.stats?.missingProfiles ?? 0 },
    })
  if (props.team)
    client.setQueryData(
      jobChangeMembersQuery(scope).queryKey,
      props.team.map((m, i) => ({ userId: String(i + 1), name: m.name, avatarUrl: m.photo ?? "", tracked: m.tracked, movedLast30Days: m.moved, leftLast30Days: m.left })),
    )
  if (props.user)
    client.setQueryData(meQuery().queryKey, {
      ...sampleMe,
      firstName: props.user.firstName,
      lastName: props.user.lastName,
      email: props.user.email,
      avatarUrl: props.user.photo ?? "",
      companyDomain: props.user.email.split("@")[1] ?? sampleMe.companyDomain,
    })
}

function JobChangesBody({ crm, tab }: { crm: CrmProvider; tab: JobChangesTab }): React.ReactElement {
  return (
    <div className="grid gap-6" data-slot="job-changes-route">
      <JobChangesOverviewPanel
        activeTile={tab === "changes" ? null : tab === "watches" ? "tracked" : null}
        alerts={<AlertsButton to={routes.integrations} />}
        crm={crm}
        onConfirmProfiles={noop}
        onFixProfiles={noop}
        onSelectTile={noop}
        onWatchList={noop}
      />
      <Tabs className="gap-4" value={tab}>
        <TabsList aria-label="Job changes view">
          <TabsTab value="changes">Changes</TabsTab>
          <TabsTab value="watches">Watched contacts</TabsTab>
          <TabsTab value="team">Team</TabsTab>
        </TabsList>
        <TabsPanel value="changes">
          <ChangesPanel
            audience={sampleJobChangeFilter.audience}
            crm={crm}
            kind={sampleJobChangeFilter.kind}
            newChanges={noNewJobChanges}
            onAudienceChange={noop}
            onKindChange={noop}
            onShowHistory={noop}
            onWatchList={noop}
          />
        </TabsPanel>
        <TabsPanel value="watches">
          <WatchesPanel
            crm={crm}
            onFixProfile={noop}
            onShowHistory={noop}
            onStatusChange={noop}
            onStopTracking={noop}
            onTrackAgain={noop}
            onWatchList={noop}
            status={defaultWatchFilter.status}
          />
        </TabsPanel>
        <TabsPanel value="team">
          <TeamPanel onViewChanges={noop} />
        </TabsPanel>
      </Tabs>
    </div>
  )
}

const pages = {
  "job-changes": { path: routes.jobChanges, handle: jobChangesHandle },
  activity: { path: routes.activity, handle: activityHandle },
  enrichments: { path: routes.enrichments, handle: enrichmentsHandle },
}

function PageBody({ page, crm, tab }: { page: AppPage; crm: CrmProvider; tab: JobChangesTab }): React.ReactElement {
  if (page === "activity") return <ActivityPage onPeriodChange={noop} period={samplePeriod} />
  if (page === "enrichments") return <EnrichmentsPage crm={crm} onNewJob={noop} onPageChange={noop} page={1} />
  return <JobChangesBody crm={crm} tab={tab} />
}

export function HubleadApp(props: HubleadAppProps): React.ReactElement {
  const { page, crm = "hubspot", tab = "changes", width = 1440, height = 900, sidebarCards = false, className, style } = props
  const [client] = React.useState(() => {
    const c = createPreviewQueryClient()
    seed(c, props)
    return c
  })
  const { path, handle } = pages[page]
  const [frame, setFrame] = React.useState<HTMLDivElement | null>(null)
  return (
    <QueryClientProvider client={client}>
      <CrmScope crm={crm}>
        <MemoryRouter initialEntries={[path]}>
          <JobChangesScopeContext value={scope}>
            <SidebarContext.Provider value={sidebar}>
              <div
                className={`hublead-app group/sidebar-wrapper flex has-data-[variant=inset]:bg-sidebar bg-sidebar text-foreground font-sans antialiased ${className ?? ""}`}
                data-page={page}
                ref={setFrame}
                style={{ ...appSidebarWidths, width, height, overflow: "hidden", transform: "translateZ(0)", ...style }}
              >
                <HubleadSidebar className="h-full" pathname={path} unseenFinishedJobs={noUnseenFinishedJobs}>
                  {sidebarCards ? <SidebarFeatureCards ids={["job-changes"]} onClose={noop} onOpen={noop} onShow={noop} /> : null}
                </HubleadSidebar>
                <AppShellInset>
                  <AppShellHeader handle={handle}>
                    <HubleadHeaderIndicators />
                  </AppShellHeader>
                  <AppShellMain>
                    <PageBody crm={crm} page={page} tab={tab} />
                  </AppShellMain>
                </AppShellInset>
                {frame && props.dialog === "watch-segment" ? (
                  <PortalContainerProvider container={frame}>
                    <WatchListDialog
                      buyCredits={null}
                      contact={null}
                      crm={crm}
                      listsAccess={null}
                      onOpenChange={noop}
                      open
                      slackSetupUrl={routes.integrations}
                    />
                  </PortalContainerProvider>
                ) : null}
              </div>
            </SidebarContext.Provider>
          </JobChangesScopeContext>
        </MemoryRouter>
      </CrmScope>
    </QueryClientProvider>
  )
}

export { Badge, Tabs, TabsList, TabsPanel, TabsTab }
export { Button } from "@hublead-io/ui-kit/components/button"
export { Card } from "@hublead-io/ui-kit/components/card"
export { Avatar, AvatarFallback, AvatarImage } from "@hublead-io/ui-kit/components/avatar"
export { HubleadLogo, HubleadMark, HubleadWordmark } from "@hublead-io/ui-kit/brand/logos/hublead"
