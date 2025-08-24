export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendees: {
        Row: {
          company: string | null
          email: string
          event_id: string
          id: string
          name: string
          registered_at: string | null
          registration_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          email: string
          event_id: string
          id?: string
          name: string
          registered_at?: string | null
          registration_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          email?: string
          event_id?: string
          id?: string
          name?: string
          registered_at?: string | null
          registration_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      enrichment: {
        Row: {
          attendee_id: string
          company_json: Json | null
          enriched_at: string | null
          mixrank_json: Json | null
          person_json: Json | null
          user_id: string
        }
        Insert: {
          attendee_id: string
          company_json?: Json | null
          enriched_at?: string | null
          mixrank_json?: Json | null
          person_json?: Json | null
          user_id: string
        }
        Update: {
          attendee_id?: string
          company_json?: Json | null
          enriched_at?: string | null
          mixrank_json?: Json | null
          person_json?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: true
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrichment_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_expenses: {
        Row: {
          event_id: string
          id: string
          pulled_at: string | null
          raw: Json | null
          total_cents: number
          txn_count: number
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          pulled_at?: string | null
          raw?: Json | null
          total_cents: number
          txn_count: number
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          pulled_at?: string | null
          raw?: Json | null
          total_cents?: number
          txn_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_expenses_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lead_scores: {
        Row: {
          assigned_sales_rep_id: string | null
          attendee_id: string
          is_key_lead: boolean | null
          notification_ref: string | null
          notified_at: string | null
          reason: string | null
          score: number
          user_id: string
        }
        Insert: {
          assigned_sales_rep_id?: string | null
          attendee_id: string
          is_key_lead?: boolean | null
          notification_ref?: string | null
          notified_at?: string | null
          reason?: string | null
          score: number
          user_id: string
        }
        Update: {
          assigned_sales_rep_id?: string | null
          attendee_id?: string
          is_key_lead?: boolean | null
          notification_ref?: string | null
          notified_at?: string | null
          reason?: string | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_scores_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lead_scores_assigned_sales_rep_id_fkey"
            columns: ["assigned_sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_scores_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: true
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          attendee_id: string | null
          channel: string
          destination: string
          id: string
          message: string
          pylon_ref: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          attendee_id?: string | null
          channel: string
          destination: string
          id?: string
          message: string
          pylon_ref?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          attendee_id?: string | null
          channel?: string
          destination?: string
          id?: string
          message?: string
          pylon_ref?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_reps: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          brex_api_key: string | null
          company_name: string | null
          created_at: string | null
          id: string
          luma_api_key: string | null
          onboarding_completed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brex_api_key?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          luma_api_key?: string | null
          onboarding_completed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brex_api_key?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          luma_api_key?: string | null
          onboarding_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
