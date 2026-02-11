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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          min_points_threshold: number | null
          name: string
          points_required: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          min_points_threshold?: number | null
          name: string
          points_required: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          min_points_threshold?: number | null
          name?: string
          points_required?: number
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      badge_conditions: {
        Row: {
          achievement_id: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          id: string
          required_count: number
        }
        Insert: {
          achievement_id: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          required_count?: number
        }
        Update: {
          achievement_id?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          required_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "badge_conditions_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      button_configs: {
        Row: {
          button_label: string
          created_at: string
          gomb_azonosito: string
          target_url: string | null
          tooltip: string | null
          updated_at: string
          url_target: Database["public"]["Enums"]["url_target_type"]
        }
        Insert: {
          button_label?: string
          created_at?: string
          gomb_azonosito: string
          target_url?: string | null
          tooltip?: string | null
          updated_at?: string
          url_target?: Database["public"]["Enums"]["url_target_type"]
        }
        Update: {
          button_label?: string
          created_at?: string
          gomb_azonosito?: string
          target_url?: string | null
          tooltip?: string | null
          updated_at?: string
          url_target?: Database["public"]["Enums"]["url_target_type"]
        }
        Relationships: []
      }
      challenge_health_risks: {
        Row: {
          challenge_type_id: string
          created_at: string
          display_order: number
          fade_end_days: number
          fade_start_days: number
          icon: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          challenge_type_id: string
          created_at?: string
          display_order?: number
          fade_end_days?: number
          fade_start_days?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          challenge_type_id?: string
          created_at?: string
          display_order?: number
          fade_end_days?: number
          fade_start_days?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_health_risks_challenge_type_id_fkey"
            columns: ["challenge_type_id"]
            isOneToOne: false
            referencedRelation: "challenge_types"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_milestones: {
        Row: {
          challenge_type_id: string
          created_at: string
          days_required: number | null
          description: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
          points_awarded: number
          target_value: number | null
        }
        Insert: {
          challenge_type_id: string
          created_at?: string
          days_required?: number | null
          description: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          points_awarded?: number
          target_value?: number | null
        }
        Update: {
          challenge_type_id?: string
          created_at?: string
          days_required?: number | null
          description?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          points_awarded?: number
          target_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_milestones_challenge_type_id_fkey"
            columns: ["challenge_type_id"]
            isOneToOne: false
            referencedRelation: "challenge_types"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_types: {
        Row: {
          created_at: string
          default_mode: Database["public"]["Enums"]["challenge_mode"]
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          observation_categories: Json | null
          required_observation_types: string[]
          show_daily_counter: boolean
          show_health_risks: boolean
          show_streak_counter: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_mode?: Database["public"]["Enums"]["challenge_mode"]
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          observation_categories?: Json | null
          required_observation_types?: string[]
          show_daily_counter?: boolean
          show_health_risks?: boolean
          show_streak_counter?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_mode?: Database["public"]["Enums"]["challenge_mode"]
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          observation_categories?: Json | null
          required_observation_types?: string[]
          show_daily_counter?: boolean
          show_health_risks?: boolean
          show_streak_counter?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      consent_versions: {
        Row: {
          content: string
          created_at: string
          effective_date: string
          id: string
          title: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          effective_date?: string
          id?: string
          title: string
          version: string
        }
        Update: {
          content?: string
          created_at?: string
          effective_date?: string
          id?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string
          created_at: string
          display_name: string
          id: string
          smoking_status: string
          updated_at: string
        }
        Insert: {
          age_range: string
          created_at?: string
          display_name: string
          id: string
          smoking_status: string
          updated_at?: string
        }
        Update: {
          age_range?: string
          created_at?: string
          display_name?: string
          id?: string
          smoking_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      questionnaire_permissions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          questionnaire_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          questionnaire_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          questionnaire_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_permissions_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires_config"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires_config: {
        Row: {
          completion_time: number
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          points: number
          target_url: string
          updated_at: string
        }
        Insert: {
          completion_time?: number
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          points?: number
          target_url: string
          updated_at?: string
        }
        Update: {
          completion_time?: number
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          target_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      reward_rules: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          frequency: Database["public"]["Enums"]["reward_frequency"]
          id: string
          is_active: boolean
          points: number
          updated_at: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          frequency?: Database["public"]["Enums"]["reward_frequency"]
          id?: string
          is_active?: boolean
          points?: number
          updated_at?: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          frequency?: Database["public"]["Enums"]["reward_frequency"]
          id?: string
          is_active?: boolean
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      upload_rewards: {
        Row: {
          created_at: string
          id: string
          points_awarded: number
          upload_date: string
          upload_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded: number
          upload_date?: string
          upload_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number
          upload_date?: string
          upload_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_counts: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          id: string
          last_activity_date: string | null
          total_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          last_activity_date?: string | null
          total_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          last_activity_date?: string | null
          total_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_type_id: string
          completed_at: string | null
          created_at: string
          current_mode: Database["public"]["Enums"]["challenge_mode"]
          current_streak_days: number
          id: string
          last_zero_logged_at: string | null
          longest_streak_days: number
          quit_date: string | null
          started_at: string
          status: Database["public"]["Enums"]["challenge_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_type_id: string
          completed_at?: string | null
          created_at?: string
          current_mode?: Database["public"]["Enums"]["challenge_mode"]
          current_streak_days?: number
          id?: string
          last_zero_logged_at?: string | null
          longest_streak_days?: number
          quit_date?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["challenge_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_type_id?: string
          completed_at?: string | null
          created_at?: string
          current_mode?: Database["public"]["Enums"]["challenge_mode"]
          current_streak_days?: number
          id?: string
          last_zero_logged_at?: string | null
          longest_streak_days?: number
          quit_date?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["challenge_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_type_id_fkey"
            columns: ["challenge_type_id"]
            isOneToOne: false
            referencedRelation: "challenge_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          communication_preferences: boolean
          consent_version_id: string
          consented_at: string
          health_data_processing: boolean
          id: string
          ip_address: string | null
          research_participation: boolean
          user_agent: string | null
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          communication_preferences?: boolean
          consent_version_id: string
          consented_at?: string
          health_data_processing?: boolean
          id?: string
          ip_address?: string | null
          research_participation?: boolean
          user_agent?: string | null
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          communication_preferences?: boolean
          consent_version_id?: string
          consented_at?: string
          health_data_processing?: boolean
          id?: string
          ip_address?: string | null
          research_participation?: boolean
          user_agent?: string | null
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_consent_version_id_fkey"
            columns: ["consent_version_id"]
            isOneToOne: false
            referencedRelation: "consent_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_milestone_unlocks: {
        Row: {
          id: string
          milestone_id: string
          unlocked_at: string
          user_challenge_id: string
          user_id: string
        }
        Insert: {
          id?: string
          milestone_id: string
          unlocked_at?: string
          user_challenge_id: string
          user_id: string
        }
        Update: {
          id?: string
          milestone_id?: string
          unlocked_at?: string
          user_challenge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestone_unlocks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "challenge_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_milestone_unlocks_user_challenge_id_fkey"
            columns: ["user_challenge_id"]
            isOneToOne: false
            referencedRelation: "user_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_observations: {
        Row: {
          category: string
          created_at: string
          id: string
          note: string | null
          numeric_value: number | null
          observation_date: string
          user_id: string
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          note?: string | null
          numeric_value?: number | null
          observation_date: string
          user_id: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          note?: string | null
          numeric_value?: number | null
          observation_date?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          points: number
          questionnaire_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          questionnaire_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          questionnaire_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      user_questionnaire_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          questionnaire_id: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          questionnaire_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          questionnaire_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_questionnaire_progress_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires_config"
            referencedColumns: ["id"]
          },
        ]
      }
      web_component_boxes: {
        Row: {
          anchor_id: string
          created_at: string
          html_content: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          anchor_id: string
          created_at?: string
          html_content?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          anchor_id?: string
          created_at?: string
          html_content?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_points: {
        Args: {
          p_points: number
          p_questionnaire_id?: string
          p_reason: string
        }
        Returns: Json
      }
      award_activity_points: {
        Args: {
          p_activity_type: Database["public"]["Enums"]["activity_type"]
          p_description?: string
        }
        Returns: Json
      }
      award_upload_points: {
        Args: { p_points?: number; p_upload_type: string }
        Returns: Json
      }
      check_challenge_milestones: {
        Args: { p_user_challenge_id: string }
        Returns: Json
      }
      check_is_admin: { Args: never; Returns: boolean }
      get_admin_list_masked: {
        Args: never
        Returns: {
          created_at: string
          has_user_id: boolean
          id: string
          masked_email: string
        }[]
      }
      get_questionnaire_progress_stats: { Args: never; Returns: Json }
      get_user_questionnaires: {
        Args: never
        Returns: {
          completion_time: number
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          points: number
          target_url: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "questionnaires_config"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_admin_role: {
        Args: {
          _role: Database["public"]["Enums"]["admin_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_service_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: { p_event_type: string; p_metadata?: Json }
        Returns: undefined
      }
      log_challenge_observation: {
        Args: {
          p_category: string
          p_note?: string
          p_numeric_value?: number
          p_observation_date?: string
          p_value: string
        }
        Returns: Json
      }
    }
    Enums: {
      activity_type:
        | "questionnaire_completion"
        | "lab_upload"
        | "discharge_upload"
        | "patient_summary_upload"
        | "observation_creation"
      admin_role: "super_admin" | "service_admin"
      challenge_mode: "tracking" | "reduction" | "quitting" | "maintenance"
      challenge_status: "active" | "completed" | "paused" | "cancelled"
      reward_frequency: "per_event" | "daily" | "once_total"
      url_target_type: "_blank" | "_self" | "postmessage"
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
    Enums: {
      activity_type: [
        "questionnaire_completion",
        "lab_upload",
        "discharge_upload",
        "patient_summary_upload",
        "observation_creation",
      ],
      admin_role: ["super_admin", "service_admin"],
      challenge_mode: ["tracking", "reduction", "quitting", "maintenance"],
      challenge_status: ["active", "completed", "paused", "cancelled"],
      reward_frequency: ["per_event", "daily", "once_total"],
      url_target_type: ["_blank", "_self", "postmessage"],
    },
  },
} as const
