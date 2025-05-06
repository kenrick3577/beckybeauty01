export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          mobile: string
          created_at: string
          role: 'user' | 'admin'
        }
        Insert: {
          id?: string
          email: string
          name: string
          mobile: string
          created_at?: string
          role?: 'user' | 'admin'
        }
        Update: {
          id?: string
          email?: string
          name?: string
          mobile?: string
          created_at?: string
          role?: 'user' | 'admin'
        }
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          service_id: string
          date: string
          time: string
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          created_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          service_id: string
          date: string
          time: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          created_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          service_id?: string
          date?: string
          time?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          created_at?: string
          notes?: string | null
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string
          duration: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          duration: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          duration?: number
          price?: number
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          image_url: string
          stock: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          image_url: string
          stock: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          image_url?: string
          stock?: number
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total: number
          status: 'pending' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total: number
          status?: 'pending' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total?: number
          status?: 'pending' | 'completed' | 'cancelled'
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
        }
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
  }
}