import type { MapBounds } from '../src/lib/types';

// The signed-out Android 2.252.0 map protocol: ridedott.rider.v1.Vehicles.
// Keep the wire parser here so neither protobuf nor Node's HTTP/2 enters the Worker.
type Field = { number: number; wire: number; value: number | Buffer };
export function fields(bytes: Buffer): Field[] {
  let offset = 0;
  const varint = () => {
    let value = 0;
    for (let shift = 0; shift < 70; shift += 7) {
      if (offset >= bytes.length) throw new Error('Truncated Dott protobuf');
      const byte = bytes[offset++];
      value += (byte & 127) * 2 ** shift;
      if (!(byte & 128)) return value;
    }
    throw new Error('Invalid Dott varint');
  };
  const result: Field[] = [];
  while (offset < bytes.length) {
    const tag = varint(), number = Math.floor(tag / 8), wire = tag % 8;
    if (!number) throw new Error('Invalid Dott field');
    let value: number | Buffer;
    if (wire === 0) value = varint();
    else {
      const size = wire === 1 ? 8 : wire === 5 ? 4 : wire === 2 ? varint() : -1;
      if (size < 0 || !Number.isSafeInteger(size) || offset + size > bytes.length) throw new Error('Invalid Dott field length');
      value = wire === 1 ? bytes.readDoubleLE(offset) : bytes.subarray(offset, offset + size);
      offset += size;
    }
    result.push({ number, wire, value });
  }
  return result;
}

function varint(value: number) {
  const bytes = [];
  do { bytes.push((value & 127) | (value > 127 ? 128 : 0)); value = Math.floor(value / 128); } while (value);
  return Buffer.from(bytes);
}
export function messageField(number: number, bytes: Buffer) {
  return Buffer.concat([varint(number * 8 + 2), varint(bytes.length), bytes]);
}
function point(lat: number, lng: number) {
  const bytes = Buffer.alloc(18);
  bytes[0] = 9; bytes.writeDoubleLE(lat, 1);
  bytes[9] = 17; bytes.writeDoubleLE(lng, 10);
  return bytes;
}
export function frame(message: Buffer) {
  const header = Buffer.alloc(5);
  header.writeUInt32BE(message.length, 1);
  return Buffer.concat([header, message]);
}
export function watchRequest(bounds: MapBounds) {
  return frame(Buffer.concat([
    Buffer.from([8, 1]), // MAP view; no selected-vehicle or rider data.
    messageField(2, Buffer.concat([
      messageField(1, point(bounds.north, bounds.east)),
      messageField(2, point(bounds.south, bounds.west)),
    ])),
    messageField(3, Buffer.from([1])), // ELECTRIC_KICK_SCOOTER only.
  ]));
}

function nested(field: Field) {
  if (field.wire !== 2 || typeof field.value === 'number') throw new Error('Invalid Dott message');
  return fields(field.value);
}
function stringField(all: Field[], number: number) {
  const field = all.find(field => field.number === number && field.wire === 2);
  return field && typeof field.value !== 'number' ? field.value.toString('utf8') : undefined;
}
function numberField(all: Field[], number: number, wire = 0) {
  const field = all.find(field => field.number === number && field.wire === wire);
  return typeof field?.value === 'number' ? field.value : undefined;
}

export interface DottMapVehicle { id: string; region: string; type: number; lat: number; lng: number }
export class DottVehicleStream {
  private pending = Buffer.alloc(0);
  private received = 0;
  readonly vehicles = new Map<string, DottMapVehicle>();
  synced = false;

  push(chunk: Buffer) {
    this.received += chunk.length;
    if (this.received > 16 * 1024 * 1024) throw new Error('Dott stream exceeds size limit');
    this.pending = Buffer.concat([this.pending, chunk]);
    while (!this.synced && this.pending.length >= 5) {
      if (this.pending[0] !== 0) throw new Error('Compressed Dott frames are unsupported');
      const size = this.pending.readUInt32BE(1);
      if (size > 1024 * 1024) throw new Error('Dott frame exceeds size limit');
      if (this.pending.length < size + 5) break;
      this.apply(this.pending.subarray(5, size + 5));
      this.pending = this.pending.subarray(size + 5);
    }
    return this.synced;
  }

  private apply(message: Buffer) {
    for (const modification of fields(message)) {
      if (modification.number === 3) {
        const status = numberField(nested(modification), 1);
        if (status === 2) this.vehicles.clear(); // SYNCHRONIZING starts a new snapshot.
        if (status === 1) this.synced = true; // SYNCHRONIZED is the only success boundary.
      } else if (modification.number === 2) {
        const id = stringField(nested(modification), 1);
        if (id) this.vehicles.delete(id);
      } else if (modification.number === 1) {
        const vehicle = nested(modification).find(field => field.number === 1);
        if (!vehicle) throw new Error('Dott change has no vehicle');
        const all = nested(vehicle), id = stringField(all, 1), region = stringField(all, 5), type = numberField(all, 3);
        const location = all.find(field => field.number === 2);
        const coordinates = location ? nested(location) : [];
        // Proto3 elides a zero coordinate.
        const lat = numberField(coordinates, 1, 1) ?? 0, lng = numberField(coordinates, 2, 1) ?? 0;
        if (!id || !region || type === undefined || !location || !Number.isFinite(lat) || !Number.isFinite(lng) ||
          Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Invalid Dott vehicle');
        this.vehicles.set(id, { id, region, type, lat, lng });
      }
    }
  }
}
