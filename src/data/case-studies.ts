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
  /** A screenshot of what the person sees. */
  figure?: CaseStudyFigure
}

export type CaseStudyNumber = {
  value: string
  label: string
  method: string
}

/** A screenshot. With a dark version, the page shows the one that matches
 * the color scheme of the reader. */
export type CaseStudyImage = {
  src: string
  dark?: string
  width: number
  height: number
  alt: string
}

export type CaseStudyFigure = {
  image: CaseStudyImage
  caption: string
}

export type CaseStudyMedia = {
  /** The full product, under the page header. */
  hero: CaseStudyImage
  /** A video. A study has a demo or a gallery, not both. */
  demo?: {
    title: string
    caption: string
    video: string
    poster: string
    width: number
    height: number
  }
  gallery?: {
    title: string
    intro?: string
    figures: Array<CaseStudyFigure>
  }
  phone?: CaseStudyFigure
}

export type CaseStudy = {
  slug: 'pico' | 'whimcall' | 'postmaster'
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
  media?: CaseStudyMedia
  problem: Array<string>
  role: Array<string>
  machines: Array<StateMachine>
  failureModes: Array<FailureMode>
  numbers: Array<CaseStudyNumber>
}

const PICO_COMMIT = 'abae556'
const WHIMCALL_COMMIT = 'acb7798'
const POSTMASTER_COMMIT = '22e0c83'
/** The Swift sources of Postmaster, for evidence paths. */
const PM = 'apps/macos/Sources/PostmasterNative/'
const MEASURED_ON = '27 October 2026'

const pico: CaseStudy = {
  slug: 'pico',
  title: 'Pico',
  category: 'Developer tool · AI agents',
  year: '2026',
  summary:
    'A browser workspace for coding agents. An agent keeps its work when the connection stops, the tab sleeps or the server restarts.',
  liveHref: 'https://pico.aliabbas.net/',
  liveLabel: 'pico.aliabbas.net',
  sourceHref: 'https://github.com/alivault/pico',
  evidenceBaseHref: `https://github.com/alivault/pico/blob/${PICO_COMMIT}/`,
  evidenceNote: `Paths are in the public alivault/pico repository at commit ${PICO_COMMIT}.`,
  media: {
    hero: {
      src: '/work/pico/workspace-light.webp',
      dark: '/work/pico/workspace-dark.webp',
      width: 2898,
      height: 1916,
      alt: 'The Pico workspace. The sidebar shows the agents of each project. In the middle, one agent starts two subagents. Each subagent has its own Git worktree and shows as a card. The panel on the right shows that the two subagents are done.',
    },
    demo: {
      title: 'See it work',
      caption:
        'One agent starts two subagents, each in its own Git worktree. When the two subagents are done, the agent merges their branches and runs the tests. The video has no sound.',
      video: '/work/pico/child-sessions.mp4',
      poster: '/work/pico/child-sessions-poster.webp',
      width: 1920,
      height: 1200,
    },
    phone: {
      image: {
        src: '/work/pico/mobile-light.webp',
        dark: '/work/pico/mobile-dark.webp',
        width: 780,
        height: 1688,
        alt: 'The same Pico agent on a phone. Tabs above the conversation (Changes, Agent and Terminal) replace the side panel. The subagents show as cards.',
      },
      caption:
        'The same agent on a phone. Tabs replace the side panel. The composer stays at the bottom.',
    },
  },
  problem: [
    'A coding agent can work for many minutes. During that time, the phone can lock, the Wi-Fi can stop and the tab can reload. The server can crash, or restart after each build.',
    'After each of these events, the screen must show the true state of the session. And the agent must not do an action two times: send a notification, start a job or start a child session.',
  ],
  role: [
    'I made Pico: the product idea, the interface design, the server, the web client and the local-first architecture.',
    'Pico runs its agents on the open-source pi-durable runtime (@earendil-works/pi-durable). The runtime records each step of a run in SQLite. When it starts again, it continues the runs that are not complete. Pico adds three parts: the live event stream, the reconnection logic in the browser and its own agent tools. These tools obey the replay rules of the runtime.',
  ],
  machines: [
    {
      id: 'pico-stream',
      title: 'The live event stream',
      intro:
        'The browser gets all live updates through one Server-Sent Events stream. Each event has an ID. On a new stream, the first message is always a full baseline of the session. After that, the server sends only patches to the state that the browser has.',
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
            'The browser opens the stream. It sends the ID of the last event that it got. It keeps this ID in memory and in session storage.',
        },
        {
          id: 'Replaying',
          label: 'Replaying',
          meaning:
            'The server sends the events that the browser did not get. It keeps a window of the last 512 events. It does not send old state events, because the baseline replaces them.',
        },
        {
          id: 'Baseline',
          label: 'Baseline',
          meaning:
            'The server sends the full state of the selected session and the list of sessions. Events that arrive during this step wait in a queue.',
        },
        {
          id: 'Live',
          label: 'Live',
          meaning:
            'The server sends each new state as a patch: the start position, the number of items to delete and the new items. Streamed text arrives in small parts (deltas).',
        },
        {
          id: 'Checking',
          label: 'Checking',
          meaning:
            'The stream failed. The browser asks the health endpoint if the server is up.',
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
          event: 'tab returns after 30 s, stream closed',
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
      title: 'One tool call through a crash',
      intro:
        'Each tool call is a durable task. The runtime records the intent of the call before the tool runs. If the process stops during the call, the next process uses the replay policy of the tool to decide what to do. Pico marks its tools with external effects as replay-safe. Before each of these tools acts, it reads a stored memo.',
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
          meaning: 'The runtime records the call before the tool runs.',
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
            'The tool is not replay-safe. The model gets an “interrupted” error with the output until that point, and decides what to do.',
        },
        {
          id: 'Rerun',
          label: 'Rerun',
          meaning:
            'The tool is replay-safe. It runs again from the start, and first reads its memo.',
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
      title: 'The live stream stops',
      risk: 'A phone locks, the network changes or a proxy returns a 502 error. The browser does not get the events that the server sends during the gap.',
      design: [
        'Each event has an ID. The browser keeps the last ID in session storage. A new stream sends this ID back, and the server sends the missed events again from its window of 512.',
        'Event IDs start from the clock time when the server starts, so they increase across restarts. An ID from before a restart gets no replay. The baseline replaces it.',
        'If the window does not have the ID, the server sends a resync notice and the full baseline. The browser never applies a patch to the wrong state.',
        'After the baseline, each change is a small splice. The server finds the items that are the same at the start and at the end of the list. It sends only the items between them.',
        'The window keeps only the newest state event of each session. Old full states do not push the small events out of the window.',
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
      risk: 'All requests fail at the same time. Without a guard, the page shows one error message for each failed request.',
      design: [
        'One small store holds the connection state: unknown, online or unreachable. When a request or the stream fails, the store asks the health endpoint one time.',
        'While the server is down, the store asks again after 1 s, 2 s and 3 s, and then every 5 s. The page shows one “server unreachable” view.',
        'When the server answers, the page opens a new stream with the saved event ID and loads its data again.',
        'A tab that returns after 30 s or more in the background reconnects immediately if its stream is closed.',
      ],
      evidence: [
        'apps/pico/src/lib/pico/server-connection.ts',
        'apps/pico/src/features/pico/use-app-shell-session-sync.ts',
      ],
    },
    {
      title: 'A crash or restart stops a run',
      risk: 'The process stops in the middle of a run. The agent must not lose the work, and it must not start again from zero.',
      design: [
        'The sessions are in one SQLite database. The pi-durable runtime records a checkpoint at each step of a run. When Pico starts again, the runtime continues the runs that are not complete.',
        'Pico keeps the state of its tools in documents, not in server memory. A restart does not delete a todo list, a timer, a question or a link to a child session.',
        'If a timer was due while the server was down, it fires one time at startup. Its follow-up message has a fixed request ID for each run, so the runtime refuses a second delivery.',
        'Terminals and background jobs run in a separate process, pico-pty-host. After a server restart, the server controls the jobs that continue to run, and records the jobs that stopped. A job without a process gets the status “lost”, and Pico reports it. Pico does not show it as complete.',
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
      title: 'A tool with side effects runs two times',
      risk: 'A replay-safe tool runs again after a crash. Without a guard, it sends a second notification, starts a second job or makes a second child session.',
      design: [
        'Each tool with an external effect reads its memo first. If the memo has a result, the tool returns that result and does nothing more.',
        'When job_start runs again, it reports the job that it started before. It never starts the command a second time.',
        'When spawn_session runs again, it finds the child that the same tool call made. The first message to the child has the request ID spawn:<call ID>. If the runtime already has a request ID, it returns the existing submission.',
        'One gap is still open: the effect and its memo are two steps. A crash between these steps can repeat the effect. If the effect is a message to a session, the fixed request ID closes the gap.',
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
  media: {
    hero: {
      src: '/work/whimcall/speaker.webp',
      width: 2400,
      height: 1500,
      alt: 'A Whimcall call between two people in speaker view. Jordan fills the stage, Maya shows in a small tile under him, and the call controls are at the bottom.',
    },
    gallery: {
      title: 'The call',
      intro:
        'Screenshots of a real two-person call on a local copy of Whimcall. Each browser used a fake camera that sends a still photo from Unsplash.',
      figures: [
        {
          image: {
            src: '/work/whimcall/waiting.webp',
            width: 1600,
            height: 1000,
            alt: 'Maya alone in a new call. The empty seat shows the invite link and a Copy link button.',
          },
          caption:
            'Before anyone joins, the empty seat shows the invite link. The link is the whole onboarding.',
        },
        {
          image: {
            src: '/work/whimcall/grid.webp',
            width: 1600,
            height: 1000,
            alt: 'Maya and Jordan side by side in grid view.',
          },
          caption:
            'Grid view gives each person an equal tile. A green ring shows who is speaking.',
        },
        {
          image: {
            src: '/work/whimcall/share.webp',
            width: 1600,
            height: 1000,
            alt: 'Jordan shares his screen. It fills the stage, and Maya shows in a small tile under it.',
          },
          caption:
            'In speaker view, a shared screen takes the stage by itself. The cameras move to small tiles.',
        },
        {
          image: {
            src: '/work/whimcall/chat.webp',
            width: 1600,
            height: 1000,
            alt: 'The chat panel is open beside the two video tiles, with three short messages.',
          },
          caption:
            'Chat opens beside the call, so nobody leaves the video to type. The room does not store it.',
        },
      ],
    },
    phone: {
      image: {
        src: '/work/whimcall/mobile.webp',
        width: 780,
        height: 1688,
        alt: 'The same call on a phone. Maya fills the screen, Jordan shows in a small tile, and the controls are at the bottom.',
      },
      caption:
        'On a phone, the controls collapse into a menu and stay in reach of a thumb.',
    },
  },
  problem: [
    'A guest opens a link and is in a call. No account and no app. After that, much can go wrong: the Wi-Fi changes, a deploy restarts the server, a firewall blocks direct media, or a third person joins a call that was made for two.',
    'The call must recover by itself from each of these, without a second seat for the same person and without a stuck screen.',
  ],
  role: [
    'I made Whimcall: the product concept, the brand and interface design, the full-stack development, the realtime media architecture, and the deployment.',
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
      figure: {
        image: {
          src: '/work/whimcall/room-full.webp',
          width: 1600,
          height: 889,
          alt: 'A page that says: This call is full. design-review is a free two-person room. Ask the host to start a new call with Whimcall Pro for groups. Buttons: Back home, See Pro.',
        },
        caption:
          'A third person opens the link of a free room. The page says why, and what the host can do.',
      },
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

const postmaster: CaseStudy = {
  slug: 'postmaster',
  title: 'Postmaster',
  category: 'Mac app · Email',
  year: '2026',
  summary:
    'A native Mac mail client for Gmail, Outlook, and any IMAP or JMAP account. Each action shows at once and reaches the server later. A send survives a crash without a second copy, and the HTML of a message cannot run code or load anything without consent.',
  liveHref: 'https://postmaster.aliabbas.net/',
  liveLabel: 'postmaster.aliabbas.net',
  evidenceNote: `Postmaster is a private repository. Paths are at commit ${POSTMASTER_COMMIT}.`,
  problem: [
    'A good mail client feels instant: a message leaves the inbox when you press a key. But the server confirms the change later, over IMAP, JMAP, or the Gmail API. Between the two, the app can quit, the network can drop, the server can refuse, and a refresh can arrive with the old state.',
    'Sending has a harder rule: a message must go out one time. Not zero times when the app crashes, and not two times when it starts again. And each message that arrives is HTML from a stranger, which must show as its sender made it, but must not run code or tell the sender that it was opened.',
  ],
  role: [
    'I made Postmaster: the product concept, the interface design, the native macOS app in Swift and AppKit, and the website.',
    'The app speaks IMAP, SMTP, JMAP, and the Gmail API with its own clients. It has no server and no helper process: one Swift actor in the app owns the connections, the local store, and the background work. Its only package dependency is Sparkle, for updates.',
  ],
  machines: [
    {
      id: 'postmaster-outbox',
      title: 'One message in the outbox',
      intro:
        'With Undo Send or Send Later, a message goes into the outbox in the local profile, and a timer sends it. The profile is written atomically before each step. The message gets its Message-ID when it is queued, and keeps it for each attempt.',
      source: [
        `${PM}SwiftMailEngine+Compose.swift`,
        `${PM}SwiftMailEngine.swift`,
        `${PM}MailStore+Actions.swift`,
      ],
      states: [
        {
          id: 'Queued',
          label: 'Queued',
          meaning:
            'The message and its send time are in the profile. A timer waits for the send time.',
        },
        {
          id: 'Sending',
          label: 'Sending',
          meaning:
            'The status “sending” is in the profile before the provider call starts.',
        },
        {
          id: 'Checking',
          label: 'Checking',
          meaning:
            'At launch, a message is still “sending”: the app stopped during the send. The app looks for its Message-ID in the Sent folder.',
        },
        {
          id: 'Failed',
          label: 'Failed',
          meaning:
            'The send failed. The outbox shows the error and the time of the next try.',
        },
        {
          id: 'Sent',
          label: 'Sent',
          meaning: 'The message leaves the outbox, and its draft is deleted.',
        },
        {
          id: 'Withdrawn',
          label: 'Withdrawn',
          meaning:
            'Undo, Cancel, or Edit removed the message. Edit opens it in a composer again.',
        },
      ],
      transitions: [
        {
          from: 'start',
          to: 'Queued',
          event: 'send with Undo Send or Send Later',
        },
        {
          from: 'Queued',
          to: 'Sending',
          event: 'send time comes, or Send Now',
        },
        { from: 'Queued', to: 'Withdrawn', event: 'Undo, Cancel, or Edit' },
        { from: 'Sending', to: 'Sent', event: 'provider accepts it' },
        { from: 'Sending', to: 'Failed', event: 'send fails' },
        { from: 'Sending', to: 'Checking', event: 'app stops' },
        { from: 'Checking', to: 'Sent', event: 'found in Sent' },
        {
          from: 'Checking',
          to: 'Sending',
          event: 'not in Sent',
        },
        { from: 'Checking', to: 'Failed', event: 'check fails' },
        {
          from: 'Failed',
          to: 'Sending',
          event: 'retry time comes (2 min, doubling to 60 min)',
        },
        { from: 'Failed', to: 'Queued', event: 'new send time' },
        { from: 'Failed', to: 'Withdrawn', event: 'Cancel or Edit' },
      ],
    },
    {
      id: 'postmaster-action',
      title: 'One action on a message',
      intro:
        'The app keeps two layers of message state: what the server confirmed, and a projection with the pending changes on top. The list shows the projection. Jobs go to the server in lanes, one lane for each conversation.',
      source: [
        `${PM}OptimisticMail.swift`,
        `${PM}MailActionQueue.swift`,
        `${PM}MailStore+Actions.swift`,
        `${PM}SwiftMailEngine+Mutations.swift`,
      ],
      states: [
        {
          id: 'Shown',
          label: 'Shown',
          meaning:
            'The change is in the projection, so the list shows it at once. The confirmed state stays under it.',
        },
        {
          id: 'Waiting',
          label: 'Waiting',
          meaning:
            'The job waits for its conversation lane. At most 4 jobs run at a time, and undo jobs go first.',
        },
        {
          id: 'Applying',
          label: 'Applying',
          meaning:
            'The provider call runs. A change to more than one message first stores an intent in the profile.',
        },
        {
          id: 'Confirmed',
          label: 'Confirmed',
          meaning:
            'The change becomes part of the confirmed state, and leaves the projection.',
        },
        {
          id: 'Dropped',
          label: 'Dropped',
          meaning:
            'The server refused. The change leaves the projection, so the confirmed state shows again, and the rows come back.',
        },
      ],
      transitions: [
        {
          from: 'start',
          to: 'Shown',
          event: 'archive, star, move, snooze, or delete',
        },
        { from: 'Shown', to: 'Shown', event: 'a refresh arrives' },
        { from: 'Shown', to: 'Waiting', event: 'job queued' },
        { from: 'Waiting', to: 'Applying', event: 'lane free' },
        { from: 'Applying', to: 'Confirmed', event: 'server applies it' },
        { from: 'Applying', to: 'Dropped', event: 'server refuses it' },
        {
          from: 'Confirmed',
          to: 'Shown',
          event: 'Undo: a new, inverse change',
        },
      ],
    },
  ],
  failureModes: [
    {
      title: 'The app stops in the middle of a send',
      risk: 'The app crashes or quits after the server took the message, but before the outbox recorded it. A blind retry sends a second copy.',
      design: [
        'The message gets its Message-ID when it is queued, and keeps it for every attempt.',
        'The outbox writes the status “sending” to the profile before the provider call. The profile is written atomically, so it is never half-written.',
        'At launch, the app sets a timer again for each message in the outbox. A message that is still “sending” is marked as interrupted.',
        'Before it sends an interrupted message again, the app looks for its Message-ID in the Sent folder, over IMAP, JMAP, or the Gmail API. If it is there, the message leaves the outbox and is not sent again.',
      ],
      evidence: [
        `${PM}SwiftMailEngine+Compose.swift`,
        `${PM}SwiftMailEngine.swift`,
      ],
    },
    {
      title: 'A send fails',
      risk: 'The network is down, the server refuses, or the token expired. The person thinks that the message went out.',
      design: [
        'A failed send stays in the outbox with the message “Delivery failed. Postmaster will retry automatically.” and the time of the next try.',
        'The next try comes after 2 minutes, then 4, 8, and so on, up to 60 minutes.',
        'The person can give a failed message a new send time, cancel it, or edit it. A message that is sending at that moment cannot change.',
        'The outbox holds at most 1,000 messages of at most 32 MiB each, so it cannot grow without a limit.',
      ],
      evidence: [`${PM}SwiftMailEngine+Compose.swift`],
    },
    {
      title: 'A refresh brings back the old state',
      risk: 'You archive a message, and a sync that started a second earlier arrives with the message still in the inbox. Without care, the message comes back.',
      design: [
        'In the interface, a server snapshot does not replace a message that has a pending change. The change stays on top of the confirmed state until the server answers.',
        'In the engine, each local change gets a number from a clock. A sync that started before the change does not overwrite the flags of that message, and does not remove it from the cache.',
        'A batch change stores an intent in the profile before the first server call. Until the intent is cleared, sync protects every message in it. After a crash, Recover Messages shows the intent, and the person can apply it again.',
      ],
      evidence: [
        `${PM}OptimisticMail.swift`,
        `${PM}SwiftMailEngine+Mutations.swift`,
        `${PM}SwiftMailEngine+Sync.swift`,
        `${PM}RecoveryWindowController.swift`,
      ],
    },
    {
      title: 'The server refuses an action, or an undo comes late',
      risk: 'The archive of 4 messages fails for one of them. Or you undo an archive after you also starred the message, and the undo removes the star.',
      design: [
        'A refused change leaves the projection, so the confirmed state shows again without a manual rollback. The rows come back in the list, and the selection is restored.',
        'The error says how much worked, for example “Archive: 3 completed; 1 failed.”',
        'An undo is a new change. It restores only the fields that still have the value that the first change gave them, so a later change stays.',
        'If an undo fails, the failed part stays on the undo stack.',
        'Over IMAP, a move can be undone only when the server returned the new UID of the message. Without it, the app does not offer an undo that could move the wrong message.',
      ],
      evidence: [
        `${PM}OptimisticMail.swift`,
        `${PM}MailStore+Actions.swift`,
        `${PM}SwiftMailEngine+Mutations.swift`,
      ],
    },
    {
      title: 'New mail is late, or a folder changes on the server',
      risk: 'A push connection dies without an error, a sleeping laptop wakes up, or the server rebuilds a folder and gives its messages new UIDs.',
      design: [
        'For each account, one connection waits in IMAP IDLE on the inbox, or on the JMAP push stream. The IDLE command is renewed every 285 s, before routers drop a quiet connection.',
        'When the connection drops, it opens again after 1 s, doubling to 300 s, with random jitter. A connection that lived longer than 60 s starts the delay at 1 s again.',
        'Push events that come close together cause one refresh, 300 ms after the first.',
        'A sync loop also runs every 60 s while the app is in front or notifications are on, and every 300 s when not.',
        'IMAP sync uses QRESYNC or CONDSTORE when the server has them, so it fetches only the changed flags and the removed messages. When nothing changed, it stops after SELECT.',
        'When UIDVALIDITY changes, the old UIDs mean nothing, so the app clears its cache for that folder and loads it again.',
      ],
      evidence: [
        `${PM}SwiftMailEngine+Push.swift`,
        `${PM}SwiftMailEngine+Sync.swift`,
        `${PM}SimpleMailProtocols.swift`,
      ],
    },
    {
      title: 'A message tries to run code or to track',
      risk: 'Message HTML is written by a stranger. It can carry scripts, forms, and remote images that tell the sender when and where the message was opened, or that point at a server on the local network.',
      design: [
        'The reader turns off JavaScript, sets a content security policy with default-src none, cancels every navigation, and uses a data store that is not kept. Sender styles stay, so a message looks as its sender made it.',
        'Scripts, frames, and embedded objects are removed. Form tags are removed but their content stays, and the policy refuses every form action. Fonts and style sheets from the network are never fetched.',
        'Remote images are blocked until the person approves them. Then the app fetches them itself, not the web view, and gives them to the page as data.',
        'An approved image must use HTTPS and resolve to a public address: the app checks the DNS answer and each redirect, and refuses localhost and private ranges.',
        'Each image can be at most 8 MiB, and all images of a message together at most 20 MiB. An image shows only after ImageIO decodes it, so its bytes decide that it is an image, not its content type.',
      ],
      evidence: [
        `${PM}SafeMessageWebView.swift`,
        `${PM}ReaderImageSchemeHandler.swift`,
        `${PM}SwiftMailEngine+Reading.swift`,
        `${PM}SimpleMailProtocols.swift`,
      ],
    },
  ],
  numbers: [
    {
      value: '30 s',
      label: 'longest Undo Send',
      method: `undoDelay in send, in ${PM}SwiftMailEngine+Compose.swift.`,
    },
    {
      value: '2 → 60 min',
      label: 'between tries of a failed send',
      method: `retryDelay in deliverScheduled, in ${PM}SwiftMailEngine+Compose.swift.`,
    },
    {
      value: '285 s',
      label: 'between renewals of IMAP IDLE',
      method: `renewAfter in SimpleIMAP.watch, in ${PM}SimpleMailProtocols.swift.`,
    },
    {
      value: '8 · 20 MiB',
      label: 'for one remote image, and for all of a message',
      method: `readerImage and resolvedImages in ${PM}SwiftMailEngine+Reading.swift.`,
    },
  ],
}

export const caseStudies = [
  pico,
  whimcall,
  postmaster,
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
