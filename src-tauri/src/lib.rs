use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct ProtocolVersion {
	pub major: u16,
	pub minor: u16,
}

impl ProtocolVersion { 
	pub const CURRENT: Self = Self {
		major: 1,
		minor: 0,
	};
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ClientKind {
	Tauri,
	Cli,
	Daemon,
	NativeObserver,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hello {
	pub protocol: ProtocolVersion,
	pub client: ClientKind,
	pub pid: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HelloAck {
	pub protocol: ProtocolVersion,
	pub server: ClientKind,
	pub connection_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcError {
	pub code: IpcErrorCode,
	pub message: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum IpcErrorCode {
	ProtocolMismatch,
	InvalidMessage,
	NotReady,
	Unsupported,
	Internal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IpcMessage {
	Hello(Hello),
	HelloAck(HelloAck),

	// Leave these available for the next step.
	Event(serde_json::Value),
	Command(serde_json::Value),
	Response(serde_json::Value),

	Ping {
		id: u64,
	},

	Pong {
		id: u64,
	},

	Error(IpcError),

	Shutdown,
}
