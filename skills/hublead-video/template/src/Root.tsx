import { getAudioDurationInSeconds } from '@remotion/media-utils';
import React from 'react';
import { Composition, staticFile } from 'remotion';
import film from '../film.json';
import { Film, type FilmProps, filmFrames, FPS } from './Film';
import type { FilmSpec } from './spec';

const spec = film as FilmSpec;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Film"
    component={Film}
    fps={FPS}
    width={1920}
    height={1080}
    durationInFrames={filmFrames(spec)}
    defaultProps={{ spec, musicFrom: 0 } as FilmProps}
    calculateMetadata={async ({ props }) => {
      const frames = filmFrames(props.spec);
      if (!props.spec.music) return { durationInFrames: frames, props };
      // the film ends on the track's own ending: start the track (its length - the film's) seconds in
      const track = await getAudioDurationInSeconds(staticFile(props.spec.music));
      const musicFrom = Math.max(0, Math.round((track - frames / FPS) * FPS));
      return { durationInFrames: frames, props: { ...props, musicFrom } };
    }}
  />
);
