import type * as React from "react"

export type AppPage = "job-changes" | "activity" | "enrichments"
export type JobChangesTab = "changes" | "watches" | "team"
export type SampleRole = { company: string; title: string; logo?: string }
export type SampleChange = { firstName: string; lastName: string; photo?: string; from: SampleRole; to?: SampleRole | null; daysAgo?: number }
export type SampleUser = { firstName: string; lastName: string; email: string; photo?: string }
export type HubleadAppProps = {
  page: AppPage
  crm?: "hubspot" | "salesforce"
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
export declare function HubleadApp(props: HubleadAppProps): React.ReactElement
export declare function letterLogo(name: string): string
type Part = React.FC<Record<string, unknown> & { className?: string; children?: React.ReactNode }>
export declare const Badge: Part
export declare const Button: Part
export declare const Card: Part
export declare const Avatar: Part
export declare const AvatarImage: Part
export declare const AvatarFallback: Part
export declare const Tabs: Part
export declare const TabsList: Part
export declare const TabsTab: Part
export declare const TabsPanel: Part
export declare const HubleadLogo: Part
export declare const HubleadMark: Part
export declare const HubleadWordmark: Part
