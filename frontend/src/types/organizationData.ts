export interface previousGroup {
  title: string;
  id:string;
  resolveToGroup: boolean
}

export interface organizationGroup {
  title: string;
  id: string;
  resolve: 'groups' | 'documents'
}

export interface organizationDocument {
  group_id?: string,
  doc_id: string,
  personal?: boolean,
  partial?: boolean
}