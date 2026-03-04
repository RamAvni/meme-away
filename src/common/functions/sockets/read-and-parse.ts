import { type Socket } from "net";
import { Buffer } from "node:buffer";
// Source - https://stackoverflow.com/a/25235791
export function sendSocketMessage(socket: Socket, msg: string) {
  const newFrame = Buffer.alloc(msg.length > 125 ? 4 : 2);
  newFrame[0] = 0x81;
  if (msg.length > 125) {
    newFrame[1] = 126;
    const length = msg.length;
    newFrame[2] = length >> 8;
    newFrame[3] = length & 0xff;
  } else {
    newFrame[1] = msg.length;
  }
  socket.write(newFrame, "binary");
  socket.write(msg, "utf8");
}

// Source - https://stackoverflow.com/a/72690914
export function parseSocketMessage(buffer) {
  const firstByte = buffer.readUInt8(0);
  //const isFinalFrame = Boolean((firstByte >>> 7) & 0x1);
  //const [reserved1, reserved2, reserved3] = [ Boolean((firstByte >>> 6) & 0x1),
  // Boolean((firstByte >>> 5) & 0x1), Boolean((firstByte >>> 4) & 0x1) );
  const opCode = firstByte & 0xf;
  // We can return null to signify that this is a connection termination frame
  if (opCode === 0x8) return null;
  // We only care about text frames from this point onward
  if (opCode !== 0x1) return;
  const secondByte = buffer.readUInt8(1);
  const isMasked = Boolean((secondByte >>> 7) & 0x1);
  // Keep track of our current position as we advance through the buffer
  let currentOffset = 2;
  let payloadLength = secondByte & 0x7f;
  if (payloadLength > 125) {
    if (payloadLength === 126) {
      payloadLength = buffer.readUInt16BE(currentOffset);
      currentOffset += 2;
    } else {
      // 127
      // If this has a value, the frame size is ridiculously huge!
      //const leftPart = buffer.readUInt32BE(currentOffset);
      //const rightPart = buffer.readUInt32BE(currentOffset += 4);
      // Honestly, if the frame length requires 64 bits, you're probably doing it wrong.
      // In Node.js you'll require the BigInt type, or a special library to handle this.
      throw new Error("Large payloads not currently implemented");
    }
  }

  const data = Buffer.alloc(payloadLength);
  // Only unmask the data if the masking bit was set to 1
  if (isMasked) {
    let maskingKey = buffer.readUInt32BE(currentOffset);
    currentOffset += 4;

    // Loop through the source buffer one byte at a time, keeping track of which
    // byte in the masking key to use in the next XOR calculation
    for (let i = 0, j = 0; i < payloadLength; ++i, j = i % 4) {
      // Extract the correct byte mask from the masking key
      const shift = j == 3 ? 0 : (3 - j) << 3;

      const mask = (shift == 0 ? maskingKey : maskingKey >>> shift) & 0xff;
      // Read a byte from the source buffer
      const source = buffer.readUInt8(currentOffset++);
      // XOR the source byte and write the result to the data
      data.writeUInt8(mask ^ source, i);
    }
  } else {
    // Not masked - we can just read the data as-is
    buffer.copy(data, 0, currentOffset++);
  }

  return data;
}
