'use client';

import { useId } from 'react';
import { PLAY_TEST_LINKS, PLAY_TEST_STEPS } from '@/lib/playTest';
import type { PlayTestCopy } from '@/lib/playTestCopy';
import { playTest, usePlayTestMemory, type PlayTestPlace } from '@/lib/usePlayTest';
import Icon from './Icon';
import './playTest.css';

/**
 * The three steps to test the Android app, the same on the map and on the
 * site: join the group, become a tester on Google Play, install. Each link
 * opens in a tab of its own, so the steps are still here to come back to; the
 * next one is the one in colour.
 */
export default function PlayTestSteps({ copy, place }: { copy: PlayTestCopy; place: PlayTestPlace }) {
  const id = useId();
  const reached = usePlayTestMemory().step ?? 0;

  return (
    <>
      {/* Without bullets a list is not announced as one everywhere: the role says it again. */}
      <ol className="play-steps" role="list">
        {PLAY_TEST_STEPS.map((step, index) => {
          const number = (index + 1) as 1 | 2 | 3;
          const done = number <= reached;
          const words = copy.steps[index];
          return (
            <li key={step} data-state={done ? 'done' : number === reached + 1 ? 'next' : 'later'}>
              <span className="play-step-number" aria-hidden="true">
                {done ? <Icon name="check" size={15} strokeWidth={3} /> : number}
              </span>
              <span className="play-step-copy">
                <strong id={`${id}-${step}`}>
                  {words.title}
                  {done && <span className="sr-only">, {copy.done}</span>}
                </strong>
                <span>{words.hint}</span>
              </span>
              <a
                className="play-step-action"
                href={PLAY_TEST_LINKS[step]}
                target="_blank"
                rel="noreferrer"
                aria-describedby={`${id}-${step}`}
                onClick={() => playTest.stepped(number, place)}
              >
                {words.action}
              </a>
            </li>
          );
        })}
      </ol>
      <p className="play-note">{copy.note}</p>
    </>
  );
}

/** "Not now" and "Don't ask again", under the steps where they were offered. */
export function PlayTestDismiss({ copy, place, onDone }: { copy: PlayTestCopy; place: PlayTestPlace; onDone: () => void }) {
  return (
    <div className="play-dismiss">
      <button type="button" className="play-not-now" onClick={() => { playTest.dismissed(place); onDone(); }}>
        {copy.notNow}
      </button>
      <button type="button" className="play-never" onClick={() => { playTest.never(place); onDone(); }}>
        {copy.never}
      </button>
    </div>
  );
}
