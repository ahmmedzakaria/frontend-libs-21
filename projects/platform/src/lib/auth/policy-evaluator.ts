export type PrivilegeMatchMode = 'ANY' | 'ALL';

export function isPolicyAllowed(
    matchMode: PrivilegeMatchMode,
    privilegeCodes: string[] | undefined,
    hasPrivilege: (code: string) => boolean
): boolean {
    if (!privilegeCodes?.length) {
        return false;
    }
    return matchMode === 'ALL'
        ? privilegeCodes.every(hasPrivilege)
        : privilegeCodes.some(hasPrivilege);
}
