export function shortenAddress(address?: string, chars = 4): string {
  if (!address) return '---';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function shortenCid(cid?: string, chars = 6): string {
  if (!cid) return '---';
  if (cid.length <= chars * 2 + 3) return cid;
  return `${cid.slice(0, chars)}...${cid.slice(-chars)}`;
}
