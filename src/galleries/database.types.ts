export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      gallery_photos: {
        Row: {
          created_at: string
          gallery_id: string
          id: string
          original_filename: string
          price_ars: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          gallery_id: string
          id?: string
          original_filename: string
          price_ars?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          gallery_id?: string
          id?: string
          original_filename?: string
          price_ars?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gallery_photos_gallery_id_fkey'
            columns: ['gallery_id']
            isOneToOne: false
            referencedRelation: 'photo_galleries'
            referencedColumns: ['id']
          },
        ]
      }
      photo_galleries: {
        Row: {
          client_name: string
          client_selected_photo_ids: string[]
          cover_photo_id: string | null
          created_at: string
          event_date: string | null
          id: string
          owner_id: string
          share_token: string
          status: string
          title: string
        }
        Insert: {
          client_name: string
          client_selected_photo_ids?: string[]
          cover_photo_id?: string | null
          created_at?: string
          event_date?: string | null
          id?: string
          owner_id: string
          share_token: string
          status?: string
          title: string
        }
        Update: {
          client_name?: string
          client_selected_photo_ids?: string[]
          cover_photo_id?: string | null
          created_at?: string
          event_date?: string | null
          id?: string
          owner_id?: string
          share_token?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
