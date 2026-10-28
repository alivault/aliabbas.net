/**
 * Case studies for /work/$slug. Every claim here comes from the source code
 * of the project. Each failure mode and number names the files it comes from.
 * The state diagrams are made from the same `states` and `transitions` that
 * the tables show, so the diagram and the text cannot disagree.
 */

export type MachineState = {
  /** Mermaid ID: letters only. */
  id: string
  label: string
  meaning: string
}

export type MachineTransition = {
  /** A state ID, or `start` for the initial pseudo-state. */
  from: string
  to: string
  event: string
}

export type StateMachine = {
  id: string
  title: string
  intro: string
  /** Where the machine lives in the code. */
  source: Array<string>
  states: Array<MachineState>
  transitions: Array<MachineTransition>
}

export type FailureMode = {
  title: string
  risk: string
  design: Array<string>
  evidence: Array<string>
}

export type CaseStudyNumber = {
  value: string
  label: string
  method: string
}

export type CaseStudy = {
  slug: 'pico' | 'whimcall'
  title: string
  category: string
  year: string
  summary: string
  liveHref: string
  liveLabel: string
  sourceHref?: string
  /** Base URL for evidence links. Absent for private repositories. */
  evidenceBaseHref?: string
  evidenceNote: string
  problem: Array<string>
  role: Array<string>
  machines: Array<StateMachine>
  failureModes: Array<FailureMode>
  numbers: Array<CaseStudyNumber>
}

const PICO_COMMIT = 'abae556'
const WHIMCALL_COMMIT = 'acb7798'
const MEASURED_ON = '27 October 2026'

const pico: CaseStudy = {
  slug: 'pico',
  title: 'Pico',
  category: 'Developer tool · AI agents',
  year: '2026',
  summary:
    'A browser workspace for durable coding-agent sessions. The agent keeps its work when the stream drops, the tab sleeps, or the server restarts.',
  liveHref: 'https://pico.aliabbas.net/',
  liveLabel: 'pico.aliabbas.net',
  sourceHref: 'https://github.com/alivault/pico',
  evidenceBaseHref: `https://github.com/alivault/pico/blob/${PICO_COMMIT}/`,
  evidenceNote: `Paths are in the public alivault/pico repository at commit ${PICO_COMMIT}.`,
  problem: [
    'A coding agent can work for many minutes. During that time, the phone that shows it can lock, the Wi-Fi can drop, and the tab can reload. The server can crash, or restart after each rebuild.',
    'After each of these events, the screen must show the true state of the session. And an agent that already sent a notification, started a job, or started a child session must not do it again.',
  ],
  role: [
    'Ali made Pico: the product concept, the interface design, the server, the web client, and the local-first architecture.',
    'Pico runs its agents on the open-source pi-durable runtime (@earendil-works/pi-durable). The runtime stores each step of a run in SQLite and continues unfinished runs when it opens again. Pico adds the live event stream, the reconnect logic in the browser, and its own agent tools, which follow the replay rules of the runtime.',
  ],
  machines: [
    {
      id: 'pico-stream',
      title: 'The live event stream',
      intro:
        'The browser gets all live updates through one Server-Sent Events stream. Each event has an ID. The first message on a new stream is always a full baseline of the session. After that, the server sends only patches against what the browser already has.',
      source: [
        'apps/pico/server/src/events.ts',
        'apps/pico/server/src/api.ts',
        'apps/pico/src/features/pico/use-app-shell-session-sync.ts',
        'apps/pico/src/lib/pico/server-connection.ts',
      ],
      states: [
        {
          id: 'Connecting',
          label: 'Connecting',
          meaning:
            'The browser opens the stream. It sends the last event ID that it saw, from memory or from session storage.',
        },
        {
          id: 'Replaying',
          label: 'Replaying',
          meaning:
            'The server sends the events that the browser missed, from a window of the last 512 events. It skips old state events, because the baseline replaces them.',
        },
        {
          id: 'Baseline',
          label: 'Baseline',
          meaning:
            'The server sends the full state of the selected session and the session list. Events that arrive during this step wait in a queue.',
        },
        {
          id: 'Live',
          label: 'Live',
          meaning:
            'The server sends each new state as a patch: the start, the delete count, and the new items. Streamed text arrives as deltas.',
        },
        {
          id: 'Checking',
          label: 'Checking',
          meaning:
            'The stream failed. The browser asks the health endpoint whether the server is up.',
        },
        {
          id: 'Unreachable',
          label: 'Unreachable',
          meaning:
            'The server does not answer. The page shows one “server unreachable” view, not one error for each request.',
        },
      ],
      transitions: [
        { from: 'start', to: 'Connecting', event: 'page opens' },
        {
          from: 'Connecting',
          to: 'Replaying',
          event: 'stream opens with a last event ID',
        },
        {
          from: 'Connecting',
          to: 'Baseline',
          event: 'stream opens without a last event ID',
        },
        { from: 'Replaying', to: 'Baseline', event: 'missed events sent' },
        {
          from: 'Replaying',
          to: 'Baseline',
          event: 'ID too old, resync notice',
        },
        { from: 'Baseline', to: 'Live', event: 'queued events delivered' },
        { from: 'Live', to: 'Live', event: 'patch or delta' },
        { from: 'Live', to: 'Checking', event: 'stream error' },
        {
          from: 'Live',
          to: 'Connecting',
          event: 'tab back after 30 s, stream closed',
        },
        { from: 'Checking', to: 'Connecting', event: 'server answers' },
        { from: 'Checking', to: 'Unreachable', event: 'no answer' },
        {
          from: 'Unreachable',
          to: 'Checking',
          event: 'retry timer (1, 2, 3, 5 s)',
        },
      ],
    },
    {
      id: 'pico-tool-call',
      title: 'One tool call across a crash',
      intro:
        'Each tool call is a durable task. The runtime stores the intent of the call before the tool runs. If the process dies during the call, the next process decides what to do from the replay policy of the tool. Pico marks its tools with external effects as replay-safe, and each of them checks a stored memo before it acts.',
      source: [
        'node_modules/@earendil-works/pi-durable/README.md',
        'apps/pico/server/src/extensions/notify.ts',
        'apps/pico/server/src/extensions/jobs.ts',
        'apps/pico/server/src/extensions/sessions.ts',
        'docs/plans/durable-tools.md',
      ],
      states: [
        {
          id: 'Committed',
          label: 'Intent stored',
          meaning: 'The runtime stores the call before the tool runs.',
        },
        {
          id: 'Running',
          label: 'Running',
          meaning: 'The tool does its work.',
        },
        {
          id: 'Done',
          label: 'Result stored',
          meaning: 'The result goes into the transcript.',
        },
        {
          id: 'Cut',
          label: 'Cut off',
          meaning: 'The process crashed or restarted during the call.',
        },
        {
          id: 'Interrupted',
          label: 'Interrupted',
          meaning:
            'The tool is not replay-safe. The model gets an “interrupted” error with the output so far, and decides what to do.',
        },
        {
          id: 'Rerun',
          label: 'Rerun',
          meaning:
            'The tool is replay-safe. It runs again from the top and first reads its memo.',
        },
      ],
      transitions: [
        { from: 'start', to: 'Committed', event: 'model calls a tool' },
        { from: 'Committed', to: 'Running', event: 'execute' },
        { from: 'Running', to: 'Done', event: 'tool returns' },
        { from: 'Running', to: 'Cut', event: 'crash or restart' },
        {
          from: 'Cut',
          to: 'Interrupted',
          event: 'reopen, tool is not replay-safe',
        },
        { from: 'Cut', to: 'Rerun', event: 'reopen, tool is replay-safe' },
        {
          from: 'Rerun',
          to: 'Done',
          event: 'memo found, return the earlier result',
        },
        { from: 'Rerun', to: 'Running', event: 'no memo, do the work' },
        { from: 'Interrupted', to: 'Done', event: 'error result stored' },
      ],
    },
  ],
  failureModes: [
    {
      title: 'The live stream drops',
      risk: 'A phone locks, the network changes, or a proxy returns a 502. Events that the server sends during the gap do not arrive.',
      design: [
        'Every event has an ID, and the browser keeps the last one in session storage. A new stream sends it back, and the server replays the missed events from a window of 512.',
        'Event IDs start from the clock when the server starts, so they keep growing across restarts. An ID from before a restart gets no replay; the baseline covers it.',
        'When the window no longer covers the ID, the server says so in a resync notice and sends the full baseline. The browser never applies a patch to the wrong base.',
        'After the baseline, state changes go out as small splices: the server finds the common start and end of the item list and sends only the middle.',
        'The replay window keeps only the newest state event of each session, so old full states do not push out the small events.',
      ],
      evidence: [
        'apps/pico/server/src/events.ts',
        'apps/pico/server/src/api.ts',
        'apps/pico/src/features/pico/use-app-shell-session-sync.ts',
        'apps/pico/src/features/pico/app-shell-utils.ts',
        'apps/pico/server/test/core.test.ts',
      ],
    },
    {
      title: 'The server is down',
      risk: 'Every request fails at the same time. Without care, the page shows one error toast for each failed request.',
      design: [
        'One small store holds the connection state: unknown, online, or unreachable. A failed request or stream asks the health endpoint once.',
        'While the server is down, the store checks again after 1 s, 2 s, 3 s, and then every 5 s. The page shows one “server unreachable” view.',
        'When the server answers again, the page opens a new stream with the saved event ID and loads its data again.',
        'When a tab comes back after 30 s or more in the background and its stream is not open, it reconnects at once.',
      ],
      evidence: [
        'apps/pico/src/lib/pico/server-connection.ts',
        'apps/pico/src/features/pico/use-app-shell-session-sync.ts',
      ],
    },
    {
      title: 'A run is cut off by a crash or restart',
      risk: 'The agent is in the middle of a run when the process dies. The work must not be lost, and it must not start from zero.',
      design: [
        'Sessions live in one SQLite database. The pi-durable runtime stores a checkpoint at every step of a run and continues unfinished runs when Pico opens again.',
        'Pico keeps tool state in documents, not in server memory, so a restart does not lose a todo list, a timer, a question, or a child-session link.',
        'A timer that was due while the server was down fires one time at startup. Its follow-up message has a fixed request ID per run, so a second delivery is refused.',
        'Terminals and background jobs run in a separate pico-pty-host process. After a server restart, the server takes over the jobs that still run and records the ones that ended. A job with no process is marked “lost” and reported, not shown as finished.',
      ],
      evidence: [
        'apps/pico/server/src/core/runtime.ts',
        'apps/pico/server/src/extensions/schedule.ts',
        'apps/pico/server/src/extensions/jobs.ts',
        'apps/pico/server/test/extensions-durable.test.ts',
        'apps/pico/server/test/pty-host.test.ts',
        'docs/plans/durable-tools.md',
      ],
    },
    {
      title: 'A tool with side effects runs twice',
      risk: 'A replay-safe tool reruns after a crash. Without a guard, it sends a second notification, starts a second job, or makes a second child session.',
      design: [
        'Each tool with an external effect checks a memo first. If the memo has a result, the tool returns it and does nothing else.',
        'A rerun of job_start reports the job that it already started. It never starts the command again.',
        'A rerun of spawn_session finds the child that the same tool call made. The first message to the child has the request ID spawn:<call ID>, and the runtime returns the existing submission for a request ID that it already has.',
        'One gap stays open: the effect and its memo are two steps. A crash between them can repeat the effect. Where the effect is a message to a session, the fixed request ID closes the gap.',
      ],
      evidence: [
        'apps/pico/server/src/extensions/notify.ts',
        'apps/pico/server/src/extensions/jobs.ts',
        'apps/pico/server/src/extensions/sessions.ts',
        'node_modules/@earendil-works/pi-durable/README.md',
      ],
    },
  ],
  numbers: [
    {
      value: '512',
      label: 'events in the replay window',
      method: 'MAX_REPLAY_EVENTS in apps/pico/server/src/events.ts.',
    },
    {
      value: '1, 2, 3, 5 s',
      label: 'between health checks while the server is down',
      method: 'RETRY_DELAYS_MS in apps/pico/src/lib/pico/server-connection.ts.',
    },
    {
      value: '30 s',
      label: 'in the background before a tab reconnects',
      method:
        'RESUME_RECONNECT_AFTER_MS in apps/pico/src/features/pico/use-app-shell-session-sync.ts.',
    },
    {
      value: '121',
      label: 'server test cases in 26 files',
      method: `Counted test( declarations in apps/pico/server/test with grep, at commit ${PICO_COMMIT}, on ${MEASURED_ON}. Counted, not run.`,
    },
  ],
}

const whimcall: CaseStudy = {
  slug: 'whimcall',
  title: 'Whimcall',
  category: 'Real-time communication',
  year: '2026',
  summary:
    'Video calls that start from a link. The call survives network drops and deploys, finds a media path through strict networks, and moves to a media server when a third person joins.',
  liveHref: 'https://whimcall.com/',
  liveLabel: 'whimcall.com',
  evidenceNote: `Whimcall is a private repository. Paths are at commit ${WHIMCALL_COMMIT}.`,
  problem: [
    'A guest opens a link and is in a call. No account and no app. After that, much can go wrong: the Wi-Fi changes, a deploy restarts the server, a firewall blocks direct media, or a third person joins a call that was made for two.',
    'The call must recover by itself from each of these, without a second seat for the same person and without a stuck screen.',
  ],
  role: [
    'Ali made Whimcall: the product concept, the brand and interface design, the full-stack development, the realtime media architecture, and the deployment.',
  ],
  machines: [
    {
      id: 'whimcall-signaling',
      title: 'The signaling connection',
      intro:
        'Each browser keeps one WebSocket to the Durable Object of its room. The socket carries offers, answers, ICE candidates, presence, and media state. Close codes tell the browser if it must reconnect or stop.',
      source: [
        'src/components/whimcall/call-room.tsx',
        'src/components/whimcall/call-reconnect.ts',
        'src/server/room-protocol.ts',
      ],
      states: [
        {
          id: 'Joining',
          label: 'Joining',
          meaning: 'The browser opens the socket with its session ID and name.',
        },
        {
          id: 'Retrying',
          label: 'Retrying',
          meaning:
            'The first join failed. The browser waits 300 ms (then 900 ms) and tries again.',
        },
        {
          id: 'Joined',
          label: 'Joined',
          meaning:
            'The room sent its state. The reconnect counter goes back to zero.',
        },
        {
          id: 'Reconnecting',
          label: 'Reconnecting',
          meaning:
            'The socket closed with no leave code. The browser waits 1 s, 2 s, 4 s, then 8 s at most, times a random 0.8 to 1.0.',
        },
        {
          id: 'RoomFull',
          label: 'Room full',
          meaning:
            'The room has no free seat (close code 4005). The browser shows the limit and does not retry.',
        },
        {
          id: 'Failed',
          label: 'Could not join',
          meaning:
            'The first join failed three times. The page shows the error.',
        },
        {
          id: 'Ended',
          label: 'Ended',
          meaning:
            'The person left (4000), the moderator removed them (4003), or the lobby did not admit them (4004). No reconnect.',
        },
      ],
      transitions: [
        { from: 'start', to: 'Joining', event: 'open the room link' },
        { from: 'Joining', to: 'Joined', event: 'room state received' },
        { from: 'Joining', to: 'Retrying', event: 'open fails, retries left' },
        { from: 'Retrying', to: 'Joining', event: 'wait ends' },
        { from: 'Joining', to: 'Failed', event: 'open fails, no retries left' },
        { from: 'Joining', to: 'RoomFull', event: 'close code 4005' },
        { from: 'Joined', to: 'Reconnecting', event: 'socket closes' },
        {
          from: 'Reconnecting',
          to: 'Reconnecting',
          event: 'open fails, wait longer',
        },
        { from: 'Reconnecting', to: 'Joined', event: 'room state received' },
        {
          from: 'Joined',
          to: 'Ended',
          event: 'leave, removed, or not admitted',
        },
      ],
    },
    {
      id: 'whimcall-topology',
      title: 'The media path of a room',
      intro:
        'The room Durable Object stores which media path the room uses. Two people talk over a direct peer-to-peer connection. A third person moves the whole room to Cloudflare Realtime SFU.',
      source: [
        'src/server/room-durable-object.ts',
        'src/components/whimcall/call-room.tsx',
      ],
      states: [
        {
          id: 'P2P',
          label: 'Peer to peer',
          meaning:
            'One or two people. Media goes directly between the browsers, through TURN only when ICE cannot find a direct path. Chat and captions use the WebRTC data channel.',
        },
        {
          id: 'SFU',
          label: 'SFU',
          meaning:
            'Three or more people. Each browser publishes its tracks to Cloudflare Realtime SFU. Chat, captions, and presence go over the room WebSocket.',
        },
      ],
      transitions: [
        { from: 'start', to: 'P2P', event: 'room created' },
        { from: 'P2P', to: 'SFU', event: 'a third admitted person joins' },
        {
          from: 'SFU',
          to: 'SFU',
          event: 'people leave, the room stays SFU',
        },
        { from: 'SFU', to: 'P2P', event: 'the last socket closes' },
      ],
    },
    {
      id: 'whimcall-ice',
      title: 'Recovery of a direct call',
      intro:
        'In a two-person call, the browser watches the state of its peer connection. It gives a short drop time to heal, then restarts ICE, and then builds a new connection.',
      source: ['src/components/whimcall/call-room.tsx'],
      states: [
        {
          id: 'Connected',
          label: 'Connected',
          meaning: 'Media flows. All recovery timers are cleared.',
        },
        {
          id: 'Disconnected',
          label: 'Disconnected',
          meaning:
            'ICE reports a drop. Many drops heal by themselves, so the browser waits 4 s first.',
        },
        {
          id: 'Restarting',
          label: 'Restarting ICE',
          meaning:
            'The browser reconnects signaling and loads new ICE servers. The host sends an ICE-restart offer; the guest asks the host for one.',
        },
        {
          id: 'Rebuilding',
          label: 'Rebuilding',
          meaning:
            'Still no media after 12 s. The browser closes the peer connection and makes a new one.',
        },
      ],
      transitions: [
        { from: 'start', to: 'Connected', event: 'ICE connects' },
        { from: 'Connected', to: 'Disconnected', event: 'ICE disconnected' },
        { from: 'Disconnected', to: 'Connected', event: 'heals within 4 s' },
        { from: 'Disconnected', to: 'Restarting', event: '4 s pass' },
        { from: 'Connected', to: 'Restarting', event: 'ICE failed' },
        { from: 'Restarting', to: 'Connected', event: 'ICE connects' },
        { from: 'Restarting', to: 'Rebuilding', event: '12 s pass' },
        { from: 'Rebuilding', to: 'Connected', event: 'new offer answered' },
      ],
    },
  ],
  failureModes: [
    {
      title: 'Signaling drops during a call',
      risk: 'The Wi-Fi changes or a deploy restarts the Worker. Every browser in the room loses its socket at the same time.',
      design: [
        'The browser reconnects with exponential backoff from 1 s to 8 s. Random jitter spreads the reconnects of many browsers over time.',
        'Rooms use the WebSocket Hibernation API of Durable Objects. Each socket stores its session (role, name, mute state, tracks) in its attachment, so an idle room can leave memory and keep its sockets.',
        'The browser keeps its signaling session ID in session storage. On reconnect, the room finds the old socket for that session, keeps the role, admission, and media state, and closes the old socket with code 4001.',
        'In SFU mode, the browser sends its media state, caption state, and track metadata again as soon as the new socket opens.',
      ],
      evidence: [
        'src/components/whimcall/call-reconnect.ts',
        'src/components/whimcall/call-room.tsx',
        'src/server/room-durable-object.ts',
      ],
    },
    {
      title: 'A firewall blocks direct media',
      risk: 'Restrictive NATs and company firewalls stop a direct peer-to-peer path, and the call shows no video.',
      design: [
        'The browser tries STUN first and uses TURN only when ICE needs it.',
        'The Worker mints time-limited Cloudflare Realtime TURN credentials.',
        'If that fails, the Worker falls back to static TURN settings.',
        'TURN credentials are only for an active signaling session, with a limit of 6 for each session, plus edge rate limits. Nobody can get credentials without an open socket in the room.',
      ],
      evidence: [
        'src/server/rooms.ts',
        'src/server/functions.ts',
        'src/server/room-durable-object.ts',
      ],
    },
    {
      title: 'A direct call loses its media path',
      risk: 'The network changes under a two-person call. The peer connection goes to “disconnected” or “failed”.',
      design: [
        'A short drop gets 4 s to heal. After that, or at once on “failed”, the browser restarts ICE with fresh ICE servers.',
        'If media does not come back within 12 s, the browser closes the peer connection and builds a new one. Only one recovery runs at a time.',
      ],
      evidence: ['src/components/whimcall/call-room.tsx'],
    },
    {
      title: 'A two-person call becomes a group',
      risk: 'A full mesh of direct connections does not scale. Each new person adds an upload for each other person.',
      design: [
        'When a third admitted person joins, the room stores the SFU topology and tells every browser. Each browser closes its peer connection and publishes to Cloudflare Realtime SFU.',
        'The room stays in SFU mode when it drops back to two people, so the call does not switch paths again. It goes back to peer-to-peer only when the last socket closes.',
        'Camera video publishes three simulcast layers (full, half, and quarter size). The staged speaker gets the full layer; grid tiles get the quarter layer. A browser pulls video only for the tiles on screen, and audio only from people who are not muted.',
      ],
      evidence: [
        'src/server/room-durable-object.ts',
        'src/components/whimcall/call-room.tsx',
      ],
    },
    {
      title: 'Two devices claim one seat',
      risk: 'A person reconnects, or opens the link on a second device, while the room is full.',
      design: [
        'Open sockets are the room membership. A session that already has a socket never counts as a new seat.',
        'A full room answers with code 4005. The browser shows the limit and does not retry in a loop.',
        'Free rooms hold 2 people. Rooms from Pro hosts hold up to 100.',
      ],
      evidence: [
        'src/server/room-durable-object.ts',
        'src/server/room-protocol.ts',
        'src/components/whimcall/call-room.tsx',
      ],
    },
  ],
  numbers: [
    {
      value: '1 → 8 s',
      label: 'signaling backoff, with 0.8–1.0 jitter',
      method:
        'getSignalReconnectDelay in src/components/whimcall/call-reconnect.ts.',
    },
    {
      value: '4 s · 12 s',
      label: 'ICE drop grace, then rebuild',
      method:
        'ICE_DISCONNECTED_GRACE_MS and ICE_RECOVERY_TIMEOUT_MS in src/components/whimcall/call-room.tsx.',
    },
    {
      value: '6',
      label: 'TURN credentials for each session',
      method:
        'MAX_TURN_CREDENTIALS_PER_SESSION in src/server/room-durable-object.ts.',
    },
    {
      value: '100',
      label: 'people in a Pro room',
      method: 'MAX_PEERS_PER_ROOM in src/server/room-protocol.ts.',
    },
  ],
}

export const caseStudies = [
  pico,
  whimcall,
] as const satisfies ReadonlyArray<CaseStudy>

export type CaseStudySlug = CaseStudy['slug']

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug)
}

/** Mermaid stateDiagram-v2 source for a machine. */
export function toMermaid(machine: StateMachine) {
  const node = (id: string) => (id === 'start' ? '[*]' : id)
  return [
    'stateDiagram-v2',
    ...machine.states.map((state) => `  state "${state.label}" as ${state.id}`),
    ...machine.transitions.map(
      (transition) =>
        `  ${node(transition.from)} --> ${node(transition.to)}: ${transition.event}`,
    ),
  ].join('\n')
}
