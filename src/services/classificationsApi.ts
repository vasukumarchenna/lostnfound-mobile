import { getAPIUrl } from './api';

export interface ClassificationAttribute {
  attribute_id: number;
  classification_id: number;
  name: string;
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
  const url = `${getAPIUrl()}/classifications`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch classifications: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching classification tree:", error);
    throw error;
  }
};
