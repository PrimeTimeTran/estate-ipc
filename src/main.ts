import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type TauriContext = {
	pid: number
	platform: string
	arch: string
	cwd: string
}

type EstateContext = {
	connection_id: string
	active_app: string
	workspace: string | null
	mode: string
}

type FileEntry = {
	path: string
	kind: 'file' | 'directory'
	size?: number
}

/* -------------------------------------------------------------------------- */
/* Test paths                                                                 */
/* -------------------------------------------------------------------------- */

const TEST_DIRECTORY = '.'
const TEST_FILE = 'estate-ipc-test.txt'

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function setStatus(message: string) {
	document.querySelector('#status')!.textContent = message
}

function setText(id: string, value: string) {
	const element = document.querySelector(`#${id}`)

	if (element) {
		element.textContent = value
	}
}

/* -------------------------------------------------------------------------- */
/* Tauri context                                                              */
/* -------------------------------------------------------------------------- */

async function loadTauriContext() {
	console.log('🔥 FRONTEND → invoke tauri_context')

	const context = await invoke<TauriContext>('tauri_context')

	console.log('🔥 FRONTEND ← Tauri:', context)

	setText('tauri-pid', String(context.pid))
	setText('tauri-platform', context.platform)
	setText('tauri-arch', context.arch)
	setText('tauri-cwd', context.cwd)

	return context
}

/* -------------------------------------------------------------------------- */
/* Estate context                                                             */
/* -------------------------------------------------------------------------- */

async function loadEstateContext() {
	console.log('🔥 FRONTEND → invoke estate_context')

	const context = await invoke<EstateContext>('estate_context')

	console.log('🔥 FRONTEND ← Estate:', context)

	setText('estate-connection', context.connection_id)
	setText('active-app', context.active_app)
	setText('workspace', context.workspace ?? '—')
	setText('mode', context.mode)

	return context
}

/* -------------------------------------------------------------------------- */
/* Filesystem                                                                 */
/* -------------------------------------------------------------------------- */

async function listFiles(path: string) {
	console.log('🔥 FRONTEND → fs_list', path)

	const files = await invoke<FileEntry[]>('fs_list', { path })

	console.log('🔥 FRONTEND ← fs_list:', files)

	return files
}

async function readFile(path: string) {
	console.log('🔥 FRONTEND → fs_read', path)

	const content = await invoke<string>('fs_read', { path })

	console.log('🔥 FRONTEND ← fs_read:', content)

	return content
}

async function createFile(path: string, content: string) {
	console.log('🔥 FRONTEND → fs_create', path)

	await invoke<void>('fs_create', {
		path,
		content,
	})

	console.log('🔥 FRONTEND ← fs_create OK')
}

async function updateFile(path: string, content: string) {
	console.log('🔥 FRONTEND → fs_update', path)

	await invoke<void>('fs_update', {
		path,
		content,
	})

	console.log('🔥 FRONTEND ← fs_update OK')
}

async function deleteFile(path: string) {
	console.log('🔥 FRONTEND → fs_delete', path)

	await invoke<void>('fs_delete', {
		path,
	})

	console.log('🔥 FRONTEND ← fs_delete OK')
}


/* -------------------------------------------------------------------------- */
/* Estate events                                                              */
/* -------------------------------------------------------------------------- */

async function listenForEstateEvents() {
	console.log('🔥 FRONTEND → listening for Estate events')

	await listen('estate-event', (event) => {
		console.log('🔥 FRONTEND ← Estate event:', event.payload)

		const envelope = event.payload as {
			event?: {
				kind?: string
			}
		}

		console.log('🔥 EVENT ENVELOPE:', envelope)
	})
}
/* -------------------------------------------------------------------------- */
/* Load everything                                                            */
/* -------------------------------------------------------------------------- */

async function loadEverything() {
	console.log('🔥 ========================================')
	console.log('🔥 FRONTEND INITIALIZATION')
	console.log('🔥 ========================================')

	setStatus('Loading Tauri context...')

	await loadTauriContext()

	setStatus('Loading Estate context...')

	await loadEstateContext()

	setStatus('Testing filesystem...')

	/*
	 * LIST
	 */
	const files = await listFiles(TEST_DIRECTORY)

	setText(
		'fs-list',
		JSON.stringify(files, null, 2),
	)

	/*
	 * READ
	 *
	 * Only attempt this if the test file already exists.
	 */
	try {
		const content = await readFile(TEST_FILE)

		setText('fs-read', content)
	} catch (error) {
		console.log('🔥 FS READ skipped:', error)

		setText(
			'fs-read',
			`File does not exist yet: ${TEST_FILE}`,
		)
	}

	/*
	 * CREATE
	 */
	try {
		await createFile(
			TEST_FILE,
			'hello from Tauri → Estate',
		)

		setText(
			'fs-create',
			'✓ create succeeded',
		)
	} catch (error) {
		console.error('🔥 FS CREATE ERROR:', error)

		setText(
			'fs-create',
			`✗ ${String(error)}`,
		)
	}

	/*
	 * READ AGAIN
	 */
	try {
		const content = await readFile(TEST_FILE)

		setText('fs-read', content)
	} catch (error) {
		console.error('🔥 FS READ ERROR:', error)

		setText(
			'fs-read',
			`✗ ${String(error)}`,
		)
	}

	/*
	 * UPDATE
	 */
	try {
		await updateFile(
			TEST_FILE,
			'updated from Tauri → Estate',
		)

		setText(
			'fs-update',
			'✓ update succeeded',
		)
	} catch (error) {
		console.error('🔥 FS UPDATE ERROR:', error)

		setText(
			'fs-update',
			`✗ ${String(error)}`,
		)
	}

	/*
	 * READ AFTER UPDATE
	 */
	try {
		const content = await readFile(TEST_FILE)

		setText('fs-read', content)
	} catch (error) {
		console.error('🔥 FS READ AFTER UPDATE ERROR:', error)
	}

	/*
	 * DELETE
	 */
	try {
		await deleteFile(TEST_FILE)

		setText(
			'fs-delete',
			'✓ delete succeeded',
		)
	} catch (error) {
		console.error('🔥 FS DELETE ERROR:', error)

		setText(
			'fs-delete',
			`✗ ${String(error)}`,
		)
	}

	setStatus('✓ All Estate IPC tests completed')

	console.log('🔥 ========================================')
	console.log('🔥 FRONTEND INITIALIZATION COMPLETE')
	console.log('🔥 ========================================')
}

/* -------------------------------------------------------------------------- */
/* Startup                                                                    */
/* -------------------------------------------------------------------------- */

window.addEventListener('DOMContentLoaded', async () => {
	console.log('🔥 FRONTEND READY')

  try {
		await listenForEstateEvents()
		await loadEverything()
	} catch (error) {
		console.error(
			'🔥 FRONTEND INITIALIZATION FAILED:',
			error,
		)

		setStatus(
			`Initialization failed: ${String(error)}`,
		)
	}
})
