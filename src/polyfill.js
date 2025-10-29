import { Buffer } from 'buffer';
if (!window.Buffer) {
	// Provide Buffer for libraries needing it (telegram client)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	window.Buffer = Buffer;
}