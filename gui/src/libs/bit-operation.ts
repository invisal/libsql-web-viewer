const byteToHex: string[] = [];

for (let n = 0; n <= 0xff; ++n) {
  const hexOctet = n.toString(16).padStart(2, "0");
  byteToHex.push(hexOctet.toUpperCase());
}

// https://stackoverflow.com/questions/40031688/javascript-arraybuffer-to-hex
export function hex(arrayBuffer: ArrayBuffer) {
  const buff = new Uint8Array(arrayBuffer);
  let hexOctets = "";

  for (const b of buff) hexOctets += byteToHex[b];
  return hexOctets;
}
