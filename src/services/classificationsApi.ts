import { api } from './api';

export interface ClassificationAttribute {
  attribute_id: number;
  classification_id: number;
  name: string;
  display_label?: string;
  data_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE';
  is_required: boolean;
  options: string[] | null;
  display_order: number;
  description: string;
}

export interface ClassificationTreeItem {
  classification_id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  attributes: ClassificationAttribute[];
  children: ClassificationTreeItem[];
}

export const fetchClassificationTree = async (): Promise<ClassificationTreeItem[]> => {
  try {
    const res = await api.get<any>('/classifications');
    return res.data?.data || res.data || [];
  } catch (error) {
    console.error("Error fetching classification tree:", error);
    throw error;
  }
};
