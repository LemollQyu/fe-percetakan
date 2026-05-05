const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8082";

export type WSTimerEvent =
  | "timer_start"
  | "timer_pause"
  | "timer_resume"
  | "timer_add";

export type WSTimerMessage = {
  event: WSTimerEvent;
  order_code: string;
  timer_status: "idle" | "running" | "paused";
  started_at: string | null;
  remaining_seconds: number;
};

export function createOrderTimerSocket(
  code: string,
  onMessage: (data: WSTimerMessage) => void,
  onClose?: () => void,
): WebSocket {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/orders/${code}`);

  ws.onmessage = (event) => {
    const data: WSTimerMessage = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onclose = () => {
    onClose?.();
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  return ws;
}
