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
    'Video calls that start from a link. A call continues when the network stops or a deploy restarts the server. It finds a media path through strict networks, and moves to a media server when a third person joins.',
  liveHref: 'https://whimcall.com/',
  liveLabel: 'whimcall.com',
  evidenceNote: `Whimcall is a private repository. Paths are at commit ${WHIMCALL_COMMIT}.`,
  media: {
    hero: {
      src: '/work/whimcall/speaker.webp',
      width: 2400,
      height: 1500,
      alt: 'A Whimcall call between two people in speaker view. Jordan fills the stage. Maya shows in a small tile below him. The call controls are at the bottom.',
    },
    gallery: {
      title: 'The call',
      intro:
        'Screenshots of a real call between two people, on a local copy of Whimcall. Each browser used a fake camera that sends a photo from Unsplash.',
      figures: [
        {
          image: {
            src: '/work/whimcall/waiting.webp',
            width: 1600,
            height: 1000,
            alt: 'Maya alone in a new call. The empty seat shows the invite link and a Copy link button.',
          },
          caption:
            'Before a guest joins, the empty seat shows the invite link. The link is the only onboarding.',
        },
        {
          image: {
            src: '/work/whimcall/grid.webp',
            width: 1600,
            height: 1000,
            alt: 'Maya and Jordan side by side in grid view.',
          },
          caption:
            'Grid view gives each person a tile of the same size. A green ring shows who speaks.',
        },
        {
          image: {
            src: '/work/whimcall/share.webp',
            width: 1600,
            height: 1000,
            alt: 'Jordan shares his screen. The screen fills the stage, and Maya shows in a small tile below it.',
          },
          caption:
            'In speaker view, a shared screen fills the stage. The cameras move to small tiles.',
        },
        {
          image: {
            src: '/work/whimcall/chat.webp',
            width: 1600,
            height: 1000,
            alt: 'The chat panel is open next to the two video tiles. It has three short messages.',
          },
          caption:
            'Chat opens next to the call, so nobody leaves the video to type. The room does not keep the messages.',
        },
      ],
    },
    phone: {
      image: {
        src: '/work/whimcall/mobile.webp',
        width: 780,
        height: 1688,
        alt: 'The same call on a phone. Maya fills the screen, Jordan shows in a small tile and the controls are at the bottom.',
      },
      caption:
        'On a phone, the controls go into a menu. They stay near the thumb.',
    },
  },
  problem: [
    'A guest opens a link and is in the call, with no account and no app. After that, many problems can occur: the Wi-Fi changes, a deploy restarts the server, a firewall blocks direct media, or a third person joins a call for two.',
    'The call must recover from each of these problems automatically. The same person must not get a second seat, and the screen must not freeze.',
  ],
  role: [
    'I made Whimcall: the product idea, the brand and interface design, the full-stack development, the real-time media architecture and the deployment.',
  ],
  machines: [
    {
      id: 'whimcall-signaling',
      title: 'The signaling connection',
      intro:
        'Each browser keeps one WebSocket to the Durable Object of its room. The socket carries offers, answers, ICE candidates, presence and media state. Close codes tell the browser to reconnect or to stop.',
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
            'The room sent its state. The browser sets the reconnect counter to zero.',
        },
        {
          id: 'Reconnecting',
          label: 'Reconnecting',
          meaning:
            'The socket closed without a leave code. The browser waits 1 s, 2 s, 4 s and then a maximum of 8 s. A random factor from 0.8 to 1.0 changes each wait.',
        },
        {
          id: 'RoomFull',
          label: 'Room full',
          meaning:
            'The room has no free seat (close code 4005). The browser shows the limit and does not try again.',
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
            'The person left (4000), the moderator removed the person (4003), or the lobby did not admit the person (4004). The browser does not reconnect.',
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
        'The Durable Object of the room records the media path of the room. Two people talk over a direct peer-to-peer connection. When a third person joins, the full room moves to Cloudflare Realtime SFU.',
      source: [
        'src/server/room-durable-object.ts',
        'src/components/whimcall/call-room.tsx',
      ],
      states: [
        {
          id: 'P2P',
          label: 'Peer to peer',
          meaning:
            'One or two people. Media goes directly between the browsers. It goes through TURN only if ICE cannot find a direct path. Chat and captions use the WebRTC data channel.',
        },
        {
          id: 'SFU',
          label: 'SFU',
          meaning:
            'Three or more people. Each browser sends its tracks to Cloudflare Realtime SFU. Chat, captions and presence go through the WebSocket of the room.',
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
        'In a call for two, the browser monitors the state of its peer connection. After a short interruption, it waits some time for the connection to recover. Then it restarts ICE. Then it makes a new connection.',
      source: ['src/components/whimcall/call-room.tsx'],
      states: [
        {
          id: 'Connected',
          label: 'Connected',
          meaning: 'Media flows. The browser stops all recovery timers.',
        },
        {
          id: 'Disconnected',
          label: 'Disconnected',
          meaning:
            'ICE reports an interruption. Many interruptions stop by themselves, so the browser waits 4 s first.',
        },
        {
          id: 'Restarting',
          label: 'Restarting ICE',
          meaning:
            'The browser reconnects signaling and gets new ICE servers. The host sends an ICE-restart offer. The guest asks the host for one.',
        },
        {
          id: 'Rebuilding',
          label: 'Rebuilding',
          meaning:
            'After 12 s, there is still no media. The browser closes the peer connection and makes a new one.',
        },
      ],
      transitions: [
        { from: 'start', to: 'Connected', event: 'ICE connects' },
        { from: 'Connected', to: 'Disconnected', event: 'ICE disconnected' },
        { from: 'Disconnected', to: 'Connected', event: 'recovers in 4 s' },
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
      title: 'Signaling stops during a call',
      risk: 'The Wi-Fi changes, or a deploy restarts the Worker. All browsers in the room lose their sockets at the same time.',
      design: [
        'The browser reconnects with exponential backoff, from 1 s to 8 s. A random factor spreads the reconnections of many browsers over time.',
        'Rooms use the WebSocket Hibernation API of Durable Objects. Each socket keeps its session (role, name, mute state and tracks) in its attachment. An idle room can then leave memory and keep its sockets.',
        'The browser keeps its signaling session ID in session storage. When the browser reconnects, the room finds the old socket of that session. The room keeps the role, the admission and the media state, and closes the old socket with code 4001.',
        'In SFU mode, the browser sends its media state, caption state and track metadata again immediately when the new socket opens.',
      ],
      evidence: [
        'src/components/whimcall/call-reconnect.ts',
        'src/components/whimcall/call-room.tsx',
        'src/server/room-durable-object.ts',
      ],
    },
    {
      title: 'A firewall blocks direct media',
      risk: 'Strict NATs and company firewalls block a direct peer-to-peer path. The call then shows no video.',
      design: [
        'The browser tries STUN first. It uses TURN only if ICE needs it.',
        'The Worker makes Cloudflare Realtime TURN credentials with a time limit.',
        'If this fails, the Worker uses static TURN settings.',
        'Only a browser with an open signaling session can get TURN credentials. Each session gets a maximum of 6, and the edge also limits the rate. Without an open socket in the room, nobody can get credentials.',
      ],
      evidence: [
        'src/server/rooms.ts',
        'src/server/functions.ts',
        'src/server/room-durable-object.ts',
      ],
    },
    {
      title: 'A direct call loses its media path',
      risk: 'The network changes during a call for two. The peer connection goes to “disconnected” or “failed”.',
      design: [
        'After a short interruption, the browser waits 4 s for the connection to recover. Then, or immediately on “failed”, it restarts ICE with new ICE servers.',
        'If media does not return in 12 s, the browser closes the peer connection and makes a new one. Only one recovery runs at a time.',
      ],
      evidence: ['src/components/whimcall/call-room.tsx'],
    },
    {
      title: 'A call for two becomes a group',
      risk: 'A full mesh of direct connections does not scale. Each new person adds one upload for each other person.',
      design: [
        'When a third admitted person joins, the room records the SFU topology and tells all browsers. Each browser closes its peer connection and sends its media to Cloudflare Realtime SFU.',
        'When the room has two people again, it stays in SFU mode, so the call does not change paths again. It goes back to peer-to-peer only when the last socket closes.',
        'Camera video has three simulcast layers: full, half and quarter size. The speaker on the stage gets the full layer. Grid tiles get the quarter layer. A browser gets video only for the tiles on the screen, and audio only from people who are not muted.',
      ],
      evidence: [
        'src/server/room-durable-object.ts',
        'src/components/whimcall/call-room.tsx',
      ],
    },
    {
      title: 'Two devices try to use one seat',
      risk: 'A person reconnects, or opens the link on a second device, while the room is full.',
      design: [
        'The open sockets are the members of the room. A session that has a socket never counts as a new seat.',
        'A full room answers with code 4005. The browser shows the limit and does not try again in a loop.',
        'Free rooms hold 2 people. Rooms of Pro hosts hold a maximum of 100.',
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
          'A third person opens the link of a free room. The page tells why the person cannot join, and what the host can do.',
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
      label: 'wait after an ICE interruption, then a new connection',
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
    'A native Mac mail client for Gmail, Outlook and all IMAP or JMAP accounts. Each action shows immediately and goes to the server later. After a crash, a message goes out one time only. The HTML of a message cannot run code, and it loads nothing without approval.',
  liveHref: 'https://postmaster.aliabbas.net/',
  liveLabel: 'postmaster.aliabbas.net',
  evidenceNote: `Postmaster is a private repository. Paths are at commit ${POSTMASTER_COMMIT}.`,
  problem: [
    'A good mail client feels instant: a message leaves the inbox when you push a key. But the server confirms the change later, through IMAP, JMAP or the Gmail API. Between these two events, the app can quit, the network can stop, the server can refuse the change, and a refresh can bring the old state.',
    'Sending has a stricter rule: each message must go out one time. Not zero times if the app crashes, and not two times when it starts again. Also, each new message is HTML from a stranger. The app must show it as its sender made it. But the HTML must not run code or tell the sender that you opened it.',
  ],
  role: [
    'I made Postmaster: the product idea, the interface design, the native macOS app in Swift and AppKit, and the website.',
    'The app uses its own clients for IMAP, SMTP, JMAP and the Gmail API. It has no server and no helper process. One Swift actor in the app controls the connections, the local store and the background work. Its only package dependency is Sparkle, for updates.',
  ],
  machines: [
    {
      id: 'postmaster-outbox',
      title: 'One message in the outbox',
      intro:
        'With Undo Send or Send Later, a message goes into the outbox in the local profile, and a timer sends it. Before each step, the app writes the full profile in one operation (atomically). The message gets its Message-ID when it goes into the queue. It keeps this ID for each attempt.',
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
            'The app writes the status “sending” in the profile before the provider call starts.',
        },
        {
          id: 'Checking',
          label: 'Checking',
          meaning:
            'At launch, a message has the status “sending”: the app stopped during the send. The app looks for the Message-ID in the Sent folder.',
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
          meaning:
            'The message leaves the outbox, and the app deletes its draft.',
        },
        {
          id: 'Withdrawn',
          label: 'Withdrawn',
          meaning:
            'Undo, Cancel or Edit removed the message. Edit opens it in a composer again.',
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
        { from: 'Queued', to: 'Withdrawn', event: 'Undo, Cancel or Edit' },
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
          event: 'retry time (2 min, doubles to 60 min)',
        },
        { from: 'Failed', to: 'Queued', event: 'new send time' },
        { from: 'Failed', to: 'Withdrawn', event: 'Cancel or Edit' },
      ],
    },
    {
      id: 'postmaster-action',
      title: 'One action on a message',
      intro:
        'The app keeps two layers of message state: the state that the server confirmed, and a projection with the pending changes on top. The list shows the projection. Jobs go to the server in lanes, with one lane for each conversation.',
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
            'The change is in the projection, so the list shows it immediately. The confirmed state stays below it.',
        },
        {
          id: 'Waiting',
          label: 'Waiting',
          meaning:
            'The job waits for its conversation lane. A maximum of 4 jobs run at a time, and undo jobs go first.',
        },
        {
          id: 'Applying',
          label: 'Applying',
          meaning:
            'The provider call runs. Before a change to more than one message, the app records an intent in the profile.',
        },
        {
          id: 'Confirmed',
          label: 'Confirmed',
          meaning:
            'The change becomes part of the confirmed state and leaves the projection.',
        },
        {
          id: 'Dropped',
          label: 'Dropped',
          meaning:
            'The server refused the change. The change leaves the projection, the confirmed state shows again and the rows return.',
        },
      ],
      transitions: [
        {
          from: 'start',
          to: 'Shown',
          event: 'archive, star, move, snooze or delete',
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
      title: 'The app stops during a send',
      risk: 'The app crashes or quits after the server accepted the message, but before the outbox recorded it. A retry without a check sends a second copy.',
      design: [
        'The message gets its Message-ID when it goes into the queue. It keeps this ID for each attempt.',
        'The outbox writes the status “sending” in the profile before the provider call. The app writes the profile atomically, so the profile is never half written.',
        'At launch, the app sets a timer again for each message in the outbox. If a message still has the status “sending”, the app marks it as interrupted.',
        'Before the app sends an interrupted message again, it looks for the Message-ID in the Sent folder, through IMAP, JMAP or the Gmail API. If the message is there, it leaves the outbox, and the app does not send it again.',
      ],
      evidence: [
        `${PM}SwiftMailEngine+Compose.swift`,
        `${PM}SwiftMailEngine.swift`,
      ],
    },
    {
      title: 'A send fails',
      risk: 'The network is down, the server refuses the message, or the token expired. The person thinks that the message went out.',
      design: [
        'A failed message stays in the outbox with the text “Delivery failed. Postmaster will retry automatically.” and the time of the next attempt.',
        'The next attempt is after 2 minutes, then 4, then 8 and so on, to a maximum of 60 minutes.',
        'The person can give a failed message a new send time, cancel it or edit it. A message that the app sends at that moment cannot change.',
        'The outbox holds a maximum of 1,000 messages, each of a maximum of 32 MiB. It cannot grow without a limit.',
      ],
      evidence: [`${PM}SwiftMailEngine+Compose.swift`],
    },
    {
      title: 'A refresh brings back the old state',
      risk: 'You archive a message. Then a sync that started one second before arrives, with the message still in the inbox. Without a guard, the message returns.',
      design: [
        'In the interface, a server snapshot does not replace a message with a pending change. The change stays on top of the confirmed state until the server answers.',
        'In the engine, each local change gets a number from a clock. A sync that started before the change does not overwrite the flags of that message. It also does not remove the message from the cache.',
        'Before the first server call of a batch change, the app records an intent in the profile. Until the app clears the intent, sync protects all messages in it. After a crash, Recover Messages shows the intent, and the person can apply it again.',
      ],
      evidence: [
        `${PM}OptimisticMail.swift`,
        `${PM}SwiftMailEngine+Mutations.swift`,
        `${PM}SwiftMailEngine+Sync.swift`,
        `${PM}RecoveryWindowController.swift`,
      ],
    },
    {
      title: 'The server refuses an action, or an undo arrives late',
      risk: 'You archive 4 messages, and the archive fails for one of them. Or you undo an archive after you also starred the message, and the undo removes the star.',
      design: [
        'A refused change leaves the projection, so the confirmed state shows again without a manual rollback. The rows return to the list, and the selection returns too.',
        'The error tells how much was done, for example “Archive: 3 completed; 1 failed.”',
        'An undo is a new change. It restores only the fields that still have the value from the first change. A later change stays.',
        'If an undo fails, the failed part stays on the undo stack.',
        'Over IMAP, you can undo a move only if the server returned the new UID of the message. Without this UID, the app does not offer an undo, because the undo could move the wrong message.',
      ],
      evidence: [
        `${PM}OptimisticMail.swift`,
        `${PM}MailStore+Actions.swift`,
        `${PM}SwiftMailEngine+Mutations.swift`,
      ],
    },
    {
      title: 'New mail is late, or a folder changes on the server',
      risk: 'A push connection stops without an error, a laptop wakes from sleep, or the server rebuilds a folder and gives its messages new UIDs.',
      design: [
        'For each account, one connection waits in IMAP IDLE on the inbox, or on the JMAP push stream. The app sends the IDLE command again every 285 s, before routers close a quiet connection.',
        'When the connection stops, the app opens it again after 1 s. Each wait is two times longer, to a maximum of 300 s, with a random factor. If a connection was open for more than 60 s, the wait starts at 1 s again.',
        'Push events that arrive close together cause one refresh, 300 ms after the first event.',
        'A sync loop also runs every 60 s while the app is in front or notifications are on. At other times, it runs every 300 s.',
        'If the server has QRESYNC or CONDSTORE, IMAP sync uses them. It then gets only the changed flags and the removed messages. If nothing changed, it stops after SELECT.',
        'When UIDVALIDITY changes, the old UIDs are not valid. The app clears its cache for that folder and loads the folder again.',
      ],
      evidence: [
        `${PM}SwiftMailEngine+Push.swift`,
        `${PM}SwiftMailEngine+Sync.swift`,
        `${PM}SimpleMailProtocols.swift`,
      ],
    },
    {
      title: 'A message tries to run code or to track you',
      risk: 'A stranger writes the HTML of a message. It can contain scripts, forms and remote images. A remote image can tell the sender when and where you opened the message, or it can point to a server on the local network.',
      design: [
        'The reader turns off JavaScript and sets a content security policy with default-src none. It cancels all navigation and uses a data store that it does not keep. The styles of the sender stay, so a message looks as its sender made it.',
        'The reader removes scripts, frames and embedded objects. It removes form tags but keeps their content, and the policy refuses all form actions. The app never gets fonts or style sheets from the network.',
        'The app blocks remote images until the person approves them. Then the app gets the images itself, not the web view, and gives them to the page as data.',
        'An approved image must use HTTPS and go to a public address. The app checks the DNS answer and each redirect. It refuses localhost and private address ranges.',
        'One image can be a maximum of 8 MiB, and all images of a message a maximum of 20 MiB. An image shows only after ImageIO decodes it. The bytes of the image, not its content type, prove that it is an image.',
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
      label: 'between attempts to send a failed message',
      method: `retryDelay in deliverScheduled, in ${PM}SwiftMailEngine+Compose.swift.`,
    },
    {
      value: '285 s',
      label: 'between renewals of IMAP IDLE',
      method: `renewAfter in SimpleIMAP.watch, in ${PM}SimpleMailProtocols.swift.`,
    },
    {
      value: '8 · 20 MiB',
      label: 'for one remote image, and for all images of a message',
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
