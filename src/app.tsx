import { useState } from 'react'
import './styles-react.css'

type NavigationFocusScope = 'topTabs' | 'sidebar' | 'search' | 'content'
type SearchResult = {
	id: string
	title: string
	description?: string
	type: string
}
type EstateNavigationState = {
	ui: {
		topTabs: boolean
		sidebar: boolean
		searchBar: boolean
	}

	current: {
		tab: string
		route: string
		query: string
	}

	focus: {
		scope: NavigationFocusScope
		topTabs: string | null
		sidebar: string | null
		search: 'input' | 'results' | null
	}

	tabs: {
		open: string[]
		active: string
		history: {
			back: string[]
			forward: string[]
		}
	}

	sidebar: {
		active: string
		collapsed: boolean
	}

	search: {
		query: string
		history: string[]
		selected: string | null
		results: SearchResult[]
	}

	actions: {
		history: Array<{
			id: string
			type: string
			name: string
			timestamp: number
			payload?: Record<string, unknown>
		}>
	}

	settings: {
		maxHistory: number
		maxSearchHistory: number
	}
}
type NavigationProps = {
	state: EstateNavigationState
	setState: React.Dispatch<React.SetStateAction<EstateNavigationState>>
}

const initialNavigationState: EstateNavigationState = {
	ui: {
		topTabs: true,
		sidebar: true,
		searchBar: true,
	},

	current: {
		tab: 'home',
		route: '/',
		query: '',
	},

	focus: {
		scope: 'content',
		topTabs: 'home',
		sidebar: 'home',
		search: null,
	},

	tabs: {
		open: ['home', 'files', 'projects'],

		active: 'home',

		history: {
			back: [],
			forward: [],
		},
	},

	sidebar: {
		active: 'home',
		collapsed: false,
	},

	search: {
		query: '',
		history: [],
		selected: null,
		results: [],
	},

	actions: {
		history: [],
	},

	settings: {
		maxHistory: 100,
		maxSearchHistory: 50,
	},
}
export default function App() {
	const [navigation, setNavigation] = useState<EstateNavigationState>(
		initialNavigationState,
	)

	return (
		<div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-on-background">
			{navigation.ui.topTabs && (
				<TopTabNavigation state={navigation} setState={setNavigation} />
			)}

			<div className="flex min-h-0 flex-1">
				{navigation.ui.sidebar && (
					<SidebarNavigation state={navigation} setState={setNavigation} />
				)}

				<main
					className="relative flex min-w-0 flex-1 flex-col"
					onFocus={() =>
						setNavigation((current) => ({
							...current,
							focus: {
								...current.focus,
								scope: 'content',
							},
						}))
					}
				>
					{navigation.ui.searchBar && (
						<SearchBar state={navigation} setState={setNavigation} />
					)}

					<div className="min-h-0 flex-1 overflow-auto p-6">
						<div className="mx-auto max-w-6xl">
							<div className="mb-6">
								<p className="mb-1 text-xs font-medium uppercase tracking-wider text-on-surface/35">
									Estate
								</p>

								<h1 className="text-2xl font-semibold tracking-tight text-on-background">
									{navigation.current.tab}
								</h1>
							</div>

							<div className="rounded-xl border border-outline/10 bg-surface p-6">
								<p className="text-sm text-on-surface/50">Content goes here.</p>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	)
}

function TopTabNavigation({ state, setState }: NavigationProps) {
	const focused = state.focus.scope === 'topTabs'

	function selectTab(tab: string) {
		if (tab === state.tabs.active) {
			return
		}

		setState((current) => ({
			...current,
			current: {
				...current.current,
				tab,
				route: `/${tab}`,
			},
			tabs: {
				...current.tabs,
				active: tab,
				history: {
					back: [...current.tabs.history.back, current.tabs.active],
					forward: [],
				},
			},
			focus: {
				...current.focus,
				scope: 'topTabs',
				topTabs: tab,
			},
			actions: {
				history: [
					...current.actions.history,
					{
						id: crypto.randomUUID(),
						type: 'navigation',
						name: 'tab.select',
						timestamp: Date.now(),
						payload: { tab },
					},
				],
			},
		}))
	}

	function moveFocus(direction: 1 | -1) {
		const currentIndex = state.tabs.open.indexOf(
			state.focus.topTabs ?? state.tabs.active,
		)

		const nextIndex =
			(currentIndex + direction + state.tabs.open.length) %
			state.tabs.open.length

		const nextTab = state.tabs.open[nextIndex]

		setState((current) => ({
			...current,
			focus: {
				...current.focus,
				scope: 'topTabs',
				topTabs: nextTab,
			},
		}))
	}

	return (
		<nav
			className={[
				'flex h-12 shrink-0 items-end',
				'border-b border-outline/10',
				'bg-surface',
				'px-3',
			].join(' ')}
		>
			<div className="flex h-9 items-end gap-1">
				{state.tabs.open.map((tab) => {
					const active = state.tabs.active === tab
					const isFocused =
						focused && state.focus.topTabs === tab

					return (
						<button
							key={tab}
							tabIndex={isFocused ? 0 : -1}
							onClick={() => selectTab(tab)}
							onFocus={() =>
								setState((current) => ({
									...current,
									focus: {
										...current.focus,
										scope: 'topTabs',
										topTabs: tab,
									},
								}))
							}
							onKeyDown={(event) => {
								if (event.key === 'ArrowRight') {
									event.preventDefault()
									moveFocus(1)
								}

								if (event.key === 'ArrowLeft') {
									event.preventDefault()
									moveFocus(-1)
								}

								if (event.key === 'Enter') {
									event.preventDefault()
									selectTab(tab)
								}
							}}
							className={[
								'relative flex h-9 min-w-24',
								'items-center justify-center',
								'rounded-t-lg px-4',
								'text-sm transition',
								'outline-none',

								// Active
								active
									? 'bg-surface-container text-on-surface'
									: 'text-on-surface/45 hover:bg-surface-container/70 hover:text-on-surface',

								// Focused
								isFocused
									? 'bg-surface-container/80 text-on-surface ring-1 ring-inset ring-primary'
									: '',

								'focus-visible:outline-none',
							].join(' ')}
						>
							{tab}

							{/* ACTIVE INDICATOR */}
							{active && (
								<span
									className={[
										'absolute bottom-0 left-2 right-2',
										'h-0.5 rounded-full',
										'bg-primary',
									].join(' ')}
								/>
							)}

							{/* FOCUS INDICATOR */}
							{isFocused && (
								<span
									className={[
										'absolute left-2 right-2 top-0',
										'h-0.5 rounded-full',
										'bg-primary/70',
									].join(' ')}
								/>
							)}
						</button>
					)
				})}

				<button
					className={[
						'mb-1 ml-1 flex h-7 w-7',
						'items-center justify-center',
						'rounded-md',
						'text-lg text-on-surface/35',
						'transition',
						'hover:bg-surface-container',
						'hover:text-on-surface',
						'focus-visible:outline-none',
						'focus-visible:ring-1',
						'focus-visible:ring-primary',
					].join(' ')}
					aria-label="New tab"
				>
					+
				</button>
			</div>
		</nav>
	)
}
function SidebarNavigation({ state, setState }: NavigationProps) {
	const items = [
		{ id: 'home', label: 'Home' },
		{ id: 'files', label: 'Files' },
		{ id: 'projects', label: 'Projects' },
		{ id: 'history', label: 'History' },
		{ id: 'settings', label: 'Settings' },
	]

	const focused = state.focus.scope === 'sidebar'

	function select(item: string) {
		setState((current) => ({
			...current,

			sidebar: {
				...current.sidebar,
				active: item,
			},

			current: {
				...current.current,
				route: `/${item}`,
			},

			focus: {
				...current.focus,
				scope: 'sidebar',
				sidebar: item,
			},

			actions: {
				history: [
					...current.actions.history,
					{
						id: crypto.randomUUID(),
						type: 'navigation',
						name: 'sidebar.select',
						timestamp: Date.now(),
						payload: { item },
					},
				],
			},
		}))
	}

	function moveFocus(direction: 1 | -1) {
		const currentIndex = items.findIndex(
			(item) =>
				item.id ===
				(state.focus.sidebar ?? state.sidebar.active),
		)

		const nextIndex =
			(currentIndex + direction + items.length) %
			items.length

		setState((current) => ({
			...current,
			focus: {
				...current.focus,
				scope: 'sidebar',
				sidebar: items[nextIndex].id,
			},
		}))
	}

	if (state.sidebar.collapsed) {
		return (
			<aside className="w-12 shrink-0 border-r border-outline/10 bg-surface">
				<button
					onClick={() =>
						setState((current) => ({
							...current,
							sidebar: {
								...current.sidebar,
								collapsed: false,
							},
						}))
					}
					className={[
						'm-2 flex h-8 w-8',
						'items-center justify-center',
						'rounded-md',
						'text-on-surface/40',
						'hover:bg-surface-container',
						'hover:text-on-surface',
					].join(' ')}
				>
					›
				</button>
			</aside>
		)
	}

	return (
		<aside
			className={[
				'w-56 shrink-0',
				'border-r border-outline/10',
				'bg-surface',
				'p-2',
			].join(' ')}
		>
			<div className="flex h-full flex-col gap-1">
				<div className="mb-2 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface/30">
					Navigation
				</div>

				{items.map((item) => {
					const active =
						state.sidebar.active === item.id

					const isFocused =
						focused &&
						state.focus.sidebar === item.id

					return (
						<button
							key={item.id}
							tabIndex={isFocused ? 0 : -1}
							onClick={() => select(item.id)}
							onFocus={() =>
								setState((current) => ({
									...current,
									focus: {
										...current.focus,
										scope: 'sidebar',
										sidebar: item.id,
									},
								}))
							}
							onKeyDown={(event) => {
								if (event.key === 'ArrowDown') {
									event.preventDefault()
									moveFocus(1)
								}

								if (event.key === 'ArrowUp') {
									event.preventDefault()
									moveFocus(-1)
								}

								if (event.key === 'Enter') {
									event.preventDefault()
									select(item.id)
								}
							}}
							className={[
								'relative flex h-9',
								'items-center',
								'rounded-md px-3',
								'text-left text-sm',
								'outline-none transition',

								// Active
								active
									? 'bg-surface-container text-on-surface'
									: 'text-on-surface/50 hover:bg-surface-container/70 hover:text-on-surface',

								// Focused
								isFocused
									? 'bg-surface-container/90 text-on-surface ring-1 ring-inset ring-primary'
									: '',

								'focus-visible:outline-none',
							].join(' ')}
						>
							{/* ACTIVE INDICATOR */}
							{active && (
								<span
									className={[
										'absolute left-0 top-1.5',
										'h-6 w-0.5',
										'rounded-full',
										'bg-primary',
									].join(' ')}
								/>
							)}

							{/* FOCUS INDICATOR */}
							{isFocused && (
								<span
									className={[
										'absolute left-0 top-1',
										'h-7 w-0.5',
										'rounded-full',
										'bg-primary/70',
									].join(' ')}
								/>
							)}

							{item.label}
						</button>
					)
				})}

				<button
					onClick={() =>
						setState((current) => ({
							...current,
							sidebar: {
								...current.sidebar,
								collapsed: true,
							},
						}))
					}
					className={[
						'mt-auto flex h-9',
						'items-center rounded-md px-3',
						'text-left text-sm text-on-surface/35',
						'hover:bg-surface-container',
						'hover:text-on-surface',
					].join(' ')}
				>
					Collapse
				</button>
			</div>
		</aside>
	)
}
function SearchBar({ state, setState }: NavigationProps) {
	const [searchFocused, setSearchFocused] = useState(false)

	const showDropdown = searchFocused || state.focus.scope === 'search'

	function search(query: string) {
		const trimmed = query.trim()

		if (!trimmed) {
			return
		}

		/*
		 * Temporary fake search results.
		 *
		 * Replace this with your Estate search command later.
		 */
		const results: SearchResult[] = [
			{
				id: 'estate-project',
				title: 'Estate Project',
				description: 'Main Estate workspace',
				type: 'Project',
			},
			{
				id: 'keyboard',
				title: 'Keyboard Events',
				description: 'macOS native keyboard event observer',
				type: 'Document',
			},
			{
				id: 'settings',
				title: 'Estate Settings',
				description: 'Application and workspace settings',
				type: 'Settings',
			},
		].filter((result) =>
			`${result.title} ${result.description ?? ''}`
				.toLowerCase()
				.includes(trimmed.toLowerCase()),
		)

		setState((current) => ({
			...current,

			current: {
				...current.current,
				query: trimmed,
			},

			focus: {
				...current.focus,
				scope: 'search',
				search: results.length > 0 ? 'results' : 'input',
			},

			search: {
				...current.search,
				query: trimmed,
				results,
				selected: results[0]?.id ?? null,
				history: [
					trimmed,
					...current.search.history.filter((item) => item !== trimmed),
				].slice(0, current.settings.maxSearchHistory),
			},

			actions: {
				history: [
					...current.actions.history,
					{
						id: crypto.randomUUID(),
						type: 'search',
						name: 'search.execute',
						timestamp: Date.now(),
						payload: {
							query: trimmed,
						},
					},
				],
			},
		}))
	}

	function selectResult(result: SearchResult) {
		setState((current) => ({
			...current,

			search: {
				...current.search,
				selected: result.id,
			},

			focus: {
				...current.focus,
				scope: 'search',
				search: 'results',
			},
		}))
	}

	function moveResult(direction: 1 | -1) {
		if (state.search.results.length === 0) {
			return
		}

		const currentIndex = state.search.results.findIndex(
			(result) => result.id === state.search.selected,
		)

		const nextIndex =
			(currentIndex + direction + state.search.results.length) %
			state.search.results.length

		const result = state.search.results[nextIndex]

		setState((current) => ({
			...current,

			focus: {
				...current.focus,
				scope: 'search',
				search: 'results',
			},

			search: {
				...current.search,
				selected: result.id,
			},
		}))
	}

	return (
		<div
			className="relative shrink-0 border-b border-outline/10 bg-surface px-4 py-3"
			onFocus={() => {
				setSearchFocused(true)

				setState((current) => ({
					...current,
					focus: {
						...current.focus,
						scope: 'search',
						search: 'input',
					},
				}))
			}}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) {
					setSearchFocused(false)
				}
			}}
		>
			<div
				className={[
					'flex h-10 items-center',
					'rounded-lg border',
					'bg-surface-container',
					'px-3',
					'transition',

					state.focus.scope === 'search'
						? 'border-primary/40 ring-1 ring-primary/20'
						: 'border-outline/15',
				].join(' ')}
			>
				<svg
					className="mr-3 h-4 w-4 shrink-0 text-on-surface/35"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<circle cx="11" cy="11" r="7" />
					<path d="m20 20-4-4" />
				</svg>

				<input
					autoComplete="off"
					value={state.search.query}
					onChange={(event) =>
						setState((current) => ({
							...current,
							search: {
								...current.search,
								query: event.target.value,
								selected: null,
								results: [],
							},
							focus: {
								...current.focus,
								scope: 'search',
								search: 'input',
							},
						}))
					}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault()
							search(state.search.query)
							return
						}

						if (event.key === 'ArrowDown') {
							event.preventDefault()
							moveResult(1)
							return
						}

						if (event.key === 'ArrowUp') {
							event.preventDefault()
							moveResult(-1)
							return
						}

						if (event.key === 'Escape') {
							setSearchFocused(false)

							setState((current) => ({
								...current,
								focus: {
									...current.focus,
									scope: 'content',
									search: null,
								},
							}))
						}
					}}
					placeholder="Search Estate..."
					className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface/30"
				/>

				<kbd className="rounded border border-outline/10 px-1.5 py-0.5 text-[10px] text-on-surface/30">
					⌘ K
				</kbd>
			</div>

			{showDropdown && (
				<div className="absolute inset-x-4 top-full z-50 mt-2 overflow-hidden rounded-xl border border-outline/15 bg-surface shadow-2xl">
					{state.search.query.trim() === '' ? (
						<SearchHistory state={state} setState={setState} />
					) : state.search.results.length > 0 ? (
						<SearchResults
							state={state}
							setState={setState}
							onSelect={selectResult}
						/>
					) : (
						<div className="px-4 py-8 text-center">
							<div className="mb-2 text-sm text-on-surface/60">No results</div>

							<div className="text-xs text-on-surface/30">
								Nothing found for “{state.search.query}”
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
function SearchResults({
	state,
	onSelect,
}: NavigationProps & {
	onSelect: (result: SearchResult) => void
}) {
	return (
		<div className="max-h-80 overflow-y-auto p-2">
			<div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface/30">
				Results
			</div>

			{state.search.results.map((result) => {
				const selected = state.search.selected === result.id

				return (
					<button
						key={result.id}
						tabIndex={-1}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => onSelect(result)}
						className={[
							'flex w-full items-center gap-3',
							'rounded-lg px-3 py-2.5',
							'text-left outline-none',
							'transition',

							selected ? 'bg-primary/10' : 'hover:bg-surface-container',
						].join(' ')}
					>
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-container text-xs text-on-surface/40">
							{result.type[0]}
						</div>

						<div className="min-w-0 flex-1">
							<div className="truncate text-sm text-on-surface">
								{result.title}
							</div>

							{result.description && (
								<div className="truncate text-xs text-on-surface/35">
									{result.description}
								</div>
							)}
						</div>

						<div className="text-[10px] text-on-surface/25">{result.type}</div>
					</button>
				)
			})}
		</div>
	)
}
function SearchHistory({ state, setState }: NavigationProps) {
	if (state.search.history.length === 0) {
		return (
			<div className="px-4 py-8 text-center text-xs text-on-surface/30">
				No search history
			</div>
		)
	}

	return (
		<div className="p-2">
			<div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface/30">
				Recent Searches
			</div>

			{state.search.history.map((query) => (
				<button
					key={query}
					onMouseDown={(event) => event.preventDefault()}
					className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-on-surface/60 hover:bg-surface-container hover:text-on-surface"
				>
					<span className="text-on-surface/25">↺</span>

					<span className="truncate">{query}</span>
				</button>
			))}
		</div>
	)
}

function goBack(
	setState: React.Dispatch<React.SetStateAction<EstateNavigationState>>,
) {
	setState((current) => {
		const back = [...current.tabs.history.back]

		const previous = back.pop()

		if (!previous) {
			return current
		}

		return {
			...current,

			current: {
				...current.current,
				tab: previous,
			},

			tabs: {
				...current.tabs,
				active: previous,

				history: {
					back,
					forward: [current.tabs.active, ...current.tabs.history.forward],
				},
			},
		}
	})
}
function goForward(
	setState: React.Dispatch<React.SetStateAction<EstateNavigationState>>,
) {
	setState((current) => {
		const forward = [...current.tabs.history.forward]

		const next = forward.shift()

		if (!next) {
			return current
		}

		return {
			...current,

			current: {
				...current.current,
				tab: next,
			},

			tabs: {
				...current.tabs,
				active: next,

				history: {
					back: [...current.tabs.history.back, current.tabs.active],
					forward,
				},
			},
		}
	})
}

// function TopTabNavigation({
// 	state,
// 	setState,
// }: NavigationProps) {
// 	function selectTab(tab: string) {
// 		if (tab === state.tabs.active) {
// 			return;
// 		}
//
// 		setState((current) => ({
// 			...current,
//
// 			current: {
// 				...current.current,
// 				tab,
// 			},
//
// 			tabs: {
// 				...current.tabs,
//
// 				active: tab,
//
// 				history: {
// 					back: [
// 						...current.tabs.history.back,
// 						current.tabs.active,
// 					],
// 					forward: [],
// 				},
// 			},
//
// 			actions: {
// 				history: [
// 					...current.actions.history,
// 					{
// 						id: crypto.randomUUID(),
// 						type: "navigation",
// 						name: "tab.select",
// 						timestamp: Date.now(),
// 						payload: { tab },
// 					},
// 				],
// 			},
// 		}));
// 	}
//
// 	return (
// 		<nav className="flex h-11 shrink-0 items-end border-b border-outline/10 bg-surface">
// 			{state.tabs.open.map((tab) => (
// 				<button
// 					key={tab}
// 					onClick={() => selectTab(tab)}
// 					className={[
// 						"h-10 px-4 text-sm transition",
// 						state.tabs.active === tab
// 							? "border-b-2 border-primary bg-surface-container text-on-surface"
// 							: "text-on-surface/50 hover:bg-surface-container/50 hover:text-on-surface",
// 					].join(" ")}
// 				>
// 					{tab}
// 				</button>
// 			))}
// 		</nav>
// 	);
// }
// function SidebarNavigation({
// 	state,
// 	setState,
// }: NavigationProps) {
// 	const items = [
// 		{ id: "home", label: "Home" },
// 		{ id: "files", label: "Files" },
// 		{ id: "projects", label: "Projects" },
// 		{ id: "history", label: "History" },
// 		{ id: "settings", label: "Settings" },
// 	];
//
// 	function select(item: string) {
// 		setState((current) => ({
// 			...current,
//
// 			sidebar: {
// 				...current.sidebar,
// 				active: item,
// 			},
//
// 			current: {
// 				...current.current,
// 				route: `/${item}`,
// 			},
//
// 			actions: {
// 				history: [
// 					...current.actions.history,
// 					{
// 						id: crypto.randomUUID(),
// 						type: "navigation",
// 						name: "sidebar.select",
// 						timestamp: Date.now(),
// 						payload: { item },
// 					},
// 				],
// 			},
// 		}));
// 	}
//
// 	if (state.sidebar.collapsed) {
// 		return (
// 			<aside className="w-12 shrink-0 border-r border-outline/10 bg-surface">
// 				<button
// 					onClick={() =>
// 						setState((current) => ({
// 							...current,
// 							sidebar: {
// 								...current.sidebar,
// 								collapsed: false,
// 							},
// 						}))
// 					}
// 					className="m-2 h-8 w-8 rounded-md hover:bg-surface-container"
// 				>
// 					›
// 				</button>
// 			</aside>
// 		);
// 	}
//
// 	return (
// 		<aside className="w-56 shrink-0 border-r border-outline/10 bg-surface">
// 			<div className="flex h-full flex-col p-2">
// 				{items.map((item) => (
// 					<button
// 						key={item.id}
// 						onClick={() => select(item.id)}
// 						className={[
// 							"rounded-md px-3 py-2 text-left text-sm",
// 							state.sidebar.active === item.id
// 								? "bg-surface-container text-on-surface"
// 								: "text-on-surface/50 hover:bg-surface-container/50",
// 						].join(" ")}
// 					>
// 						{item.label}
// 					</button>
// 				))}
//
// 				<button
// 					onClick={() =>
// 						setState((current) => ({
// 							...current,
// 							sidebar: {
// 								...current.sidebar,
// 								collapsed: true,
// 							},
// 						}))
// 					}
// 					className="mt-auto rounded-md px-3 py-2 text-left text-sm text-on-surface/40 hover:bg-surface-container"
// 				>
// 					Collapse
// 				</button>
// 			</div>
// 		</aside>
// 	);
// }
// function SearchBar({
// 	state,
// 	setState,
// }: NavigationProps) {
// 	function search(query: string) {
// 		const trimmed = query.trim();
//
// 		if (!trimmed) {
// 			return;
// 		}
//
// 		setState((current) => ({
// 			...current,
//
// 			current: {
// 				...current.current,
// 				query: trimmed,
// 			},
//
// 			search: {
// 				...current.search,
// 				query: trimmed,
// 				history: [
// 					trimmed,
// 					...current.search.history.filter(
// 						(item) => item !== trimmed,
// 					),
// 				].slice(0, current.settings.maxSearchHistory),
// 			},
//
// 			actions: {
// 				history: [
// 					...current.actions.history,
// 					{
// 						id: crypto.randomUUID(),
// 						type: "search",
// 						name: "search.execute",
// 						timestamp: Date.now(),
// 						payload: {
// 							query: trimmed,
// 						},
// 					},
// 				],
// 			},
// 		}));
// 	}
//
// 	return (
// 		<div className="flex h-14 shrink-0 items-center border-b border-outline/10 px-4">
// 			<div className="flex h-9 flex-1 items-center rounded-lg border border-outline/15 bg-surface-container px-3">
// 				<span className="mr-3 text-on-surface/40">
// 					⌕
// 				</span>
//
// 				<input
// 					value={state.search.query}
// 					onChange={(event) =>
// 						setState((current) => ({
// 							...current,
// 							search: {
// 								...current.search,
// 								query: event.target.value,
// 							},
// 						}))
// 					}
// 					onKeyDown={(event) => {
// 						if (event.key === "Enter") {
// 							search(state.search.query);
// 						}
// 					}}
// 					placeholder="Search Estate..."
// 					className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-on-surface/30"
// 				/>
//
// 				<kbd className="text-xs text-on-surface/30">
// 					⌘ K
// 				</kbd>
// 			</div>
// 		</div>
// 	);
// }
