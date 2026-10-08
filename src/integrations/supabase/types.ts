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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      broadcast_requests: {
        Row: {
          accepted_professional_id: string | null
          category_id: string
          city: string
          client_id: string
          created_at: string
          current_round: number
          description: string
          id: string
          service_request_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_professional_id?: string | null
          category_id: string
          city: string
          client_id: string
          created_at?: string
          current_round?: number
          description: string
          id?: string
          service_request_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_professional_id?: string | null
          category_id?: string
          city?: string
          client_id?: string
          created_at?: string
          current_round?: number
          description?: string
          id?: string
          service_request_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_requests_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      matching_config: {
        Row: {
          dispatch_limit: number
          dispatch_window_seconds: number
          expansion_batch_size: number
          fairness_half_life_hours: number
          id: string
          inactivity_boost_1d: number
          inactivity_boost_3d: number
          inactivity_boost_7d: number
          max_batch_size: number
          max_concurrent_per_pro: number
          response_window_minutes: number
          updated_at: string
          weight_acceptance_rate: number
          weight_activity: number
          weight_completed: number
          weight_distance: number
          weight_plan: number
          weight_rating: number
          weight_response_time: number
        }
        Insert: {
          dispatch_limit?: number
          dispatch_window_seconds?: number
          expansion_batch_size?: number
          fairness_half_life_hours?: number
          id?: string
          inactivity_boost_1d?: number
          inactivity_boost_3d?: number
          inactivity_boost_7d?: number
          max_batch_size?: number
          max_concurrent_per_pro?: number
          response_window_minutes?: number
          updated_at?: string
          weight_acceptance_rate?: number
          weight_activity?: number
          weight_completed?: number
          weight_distance?: number
          weight_plan?: number
          weight_rating?: number
          weight_response_time?: number
        }
        Update: {
          dispatch_limit?: number
          dispatch_window_seconds?: number
          expansion_batch_size?: number
          fairness_half_life_hours?: number
          id?: string
          inactivity_boost_1d?: number
          inactivity_boost_3d?: number
          inactivity_boost_7d?: number
          max_batch_size?: number
          max_concurrent_per_pro?: number
          response_window_minutes?: number
          updated_at?: string
          weight_acceptance_rate?: number
          weight_activity?: number
          weight_completed?: number
          weight_distance?: number
          weight_plan?: number
          weight_rating?: number
          weight_response_time?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
          service_request_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
          service_request_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
          service_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          professional_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          professional_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          professional_id?: string
          title?: string
        }
        Relationships: []
      }
      professional_metrics: {
        Row: {
          acceptance_rate: number
          avg_response_minutes: number
          completed_count: number
          concurrent_active: number
          last_active_at: string
          last_dispatched_at: string | null
          total_accepted: number
          total_declined: number
          total_dispatched: number
          updated_at: string
          user_id: string
        }
        Insert: {
          acceptance_rate?: number
          avg_response_minutes?: number
          completed_count?: number
          concurrent_active?: number
          last_active_at?: string
          last_dispatched_at?: string | null
          total_accepted?: number
          total_declined?: number
          total_dispatched?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          acceptance_rate?: number
          avg_response_minutes?: number
          completed_count?: number
          concurrent_active?: number
          last_active_at?: string
          last_dispatched_at?: string | null
          total_accepted?: number
          total_declined?: number
          total_dispatched?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_profiles: {
        Row: {
          category_id: string
          category_name: string
          created_at: string
          description: string | null
          experience: string | null
          id: string
          plan: string | null
          premium: boolean | null
          ranking_boost_until: string | null
          rating: number | null
          review_count: number | null
          subscription_bonus_months: number
          updated_at: string
          user_id: string
          verified: boolean | null
          visibility_boost_until: string | null
        }
        Insert: {
          category_id: string
          category_name: string
          created_at?: string
          description?: string | null
          experience?: string | null
          id?: string
          plan?: string | null
          premium?: boolean | null
          ranking_boost_until?: string | null
          rating?: number | null
          review_count?: number | null
          subscription_bonus_months?: number
          updated_at?: string
          user_id: string
          verified?: boolean | null
          visibility_boost_until?: string | null
        }
        Update: {
          category_id?: string
          category_name?: string
          created_at?: string
          description?: string | null
          experience?: string | null
          id?: string
          plan?: string | null
          premium?: boolean | null
          ranking_boost_until?: string | null
          rating?: number | null
          review_count?: number | null
          subscription_bonus_months?: number
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          visibility_boost_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_professional_profiles_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_profiles_profile_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      professional_tags: {
        Row: {
          assigned_at: string
          tag: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          tag: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          tag?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_tags_tag_fkey"
            columns: ["tag"]
            isOneToOne: false
            referencedRelation: "reputation_tag_definitions"
            referencedColumns: ["tag"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      referral_attempt_log: {
        Row: {
          code_tried: string
          created_at: string
          id: string
          result: string
          user_id: string
        }
        Insert: {
          code_tried: string
          created_at?: string
          id?: string
          result: string
          user_id: string
        }
        Update: {
          code_tried?: string
          created_at?: string
          id?: string
          result?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          clicks: number
          code: string
          created_at: string
          id: string
          last_ip_hash: string | null
          user_id: string
        }
        Insert: {
          clicks?: number
          code: string
          created_at?: string
          id?: string
          last_ip_hash?: string | null
          user_id: string
        }
        Update: {
          clicks?: number
          code?: string
          created_at?: string
          id?: string
          last_ip_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          applied_at: string | null
          boost_days: number | null
          expires_at: string | null
          granted_at: string
          id: string
          months: number | null
          referral_id: string
          reward_type: string
          status: string
          tier: number
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          boost_days?: number | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          months?: number | null
          referral_id: string
          reward_type: string
          status?: string
          tier?: number
          user_id: string
        }
        Update: {
          applied_at?: string | null
          boost_days?: number | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          months?: number | null
          referral_id?: string
          reward_type?: string
          status?: string
          tier?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          activated_at: string | null
          code_used: string
          created_at: string
          device_fingerprint: string | null
          fraud_reason: string | null
          id: string
          ip_hash: string | null
          profile_completed_at: string | null
          referred_id: string
          referred_ip_hash: string | null
          referrer_id: string
          rewarded_at: string | null
          status: string
        }
        Insert: {
          activated_at?: string | null
          code_used: string
          created_at?: string
          device_fingerprint?: string | null
          fraud_reason?: string | null
          id?: string
          ip_hash?: string | null
          profile_completed_at?: string | null
          referred_id: string
          referred_ip_hash?: string | null
          referrer_id: string
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          activated_at?: string | null
          code_used?: string
          created_at?: string
          device_fingerprint?: string | null
          fraud_reason?: string | null
          id?: string
          ip_hash?: string | null
          profile_completed_at?: string | null
          referred_id?: string
          referred_ip_hash?: string | null
          referrer_id?: string
          rewarded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_code_used_fkey"
            columns: ["code_used"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "referrals_code_used_fkey"
            columns: ["code_used"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["code"]
          },
        ]
      }
      reputation_tag_definitions: {
        Row: {
          description: string
          icon: string
          label_pt: string
          positive: boolean
          tag: string
        }
        Insert: {
          description: string
          icon: string
          label_pt: string
          positive?: boolean
          tag: string
        }
        Update: {
          description?: string
          icon?: string
          label_pt?: string
          positive?: boolean
          tag?: string
        }
        Relationships: []
      }
      request_dispatches: {
        Row: {
          broadcast_id: string
          dispatched_at: string
          expires_at: string
          id: string
          professional_id: string
          responded_at: string | null
          round: number
          score: number
          status: string
        }
        Insert: {
          broadcast_id: string
          dispatched_at?: string
          expires_at: string
          id?: string
          professional_id: string
          responded_at?: string | null
          round?: number
          score: number
          status?: string
        }
        Update: {
          broadcast_id?: string
          dispatched_at?: string
          expires_at?: string
          id?: string
          professional_id?: string
          responded_at?: string | null
          round?: number
          score?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_dispatches_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcast_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string
          id: string
          professional_id: string
          rating: number
          service_request_id: string | null
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          professional_id: string
          rating: number
          service_request_id?: string | null
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          rating?: number
          service_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          client_id: string
          created_at: string
          description: string
          id: string
          professional_id: string
          scheduled_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description: string
          id?: string
          professional_id: string
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string
          id?: string
          professional_id?: string
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      supply_limits: {
        Row: {
          category_id: string
          city: string
          created_at: string
          id: string
          max_professionals: number
          updated_at: string
        }
        Insert: {
          category_id: string
          city: string
          created_at?: string
          id?: string
          max_professionals?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          city?: string
          created_at?: string
          id?: string
          max_professionals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_limits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_scores: {
        Row: {
          acceptance_points: number | null
          activity_points: number | null
          completed_points: number | null
          computed_at: string
          level: Database["public"]["Enums"]["verification_level"]
          rating_points: number | null
          response_points: number | null
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          acceptance_points?: number | null
          activity_points?: number | null
          completed_points?: number | null
          computed_at?: string
          level?: Database["public"]["Enums"]["verification_level"]
          rating_points?: number | null
          response_points?: number | null
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          acceptance_points?: number | null
          activity_points?: number | null
          completed_points?: number | null
          computed_at?: string
          level?: Database["public"]["Enums"]["verification_level"]
          rating_points?: number | null
          response_points?: number | null
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ip_log: {
        Row: {
          id: string
          ip_hash: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          id?: string
          ip_hash: string
          recorded_at?: string
          user_id: string
        }
        Update: {
          id?: string
          ip_hash?: string
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waiting_list: {
        Row: {
          category_id: string
          city: string
          created_at: string
          id: string
          name: string
          notified_at: string | null
          phone: string
        }
        Insert: {
          category_id: string
          city: string
          created_at?: string
          id?: string
          name: string
          notified_at?: string | null
          phone: string
        }
        Update: {
          category_id?: string
          city?: string
          created_at?: string
          id?: string
          name?: string
          notified_at?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_professional_reviews: {
        Row: {
          client_name: string | null
          comment: string | null
          created_at: string | null
          id: string | null
          professional_id: string | null
          rating: number | null
        }
        Relationships: []
      }
      public_professional_directory: {
        Row: {
          avatar_url: string | null
          category_id: string | null
          category_name: string | null
          city: string | null
          description: string | null
          disponivel: boolean | null
          experience: string | null
          fixr_score: number | null
          full_name: string | null
          id: string | null
          nivel_curadoria: string | null
          plan_name: string | null
          rating: number | null
          review_count: number | null
          state: string | null
          total_concluidos: number | null
          user_id: string | null
          verified: boolean | null
        }
        Relationships: []
      }
      professional_reputation: {
        Row: {
          acceptance_rate: number | null
          activity_status: string | null
          avatar_url: string | null
          avg_rating: number | null
          avg_response_minutes: number | null
          category_id: string | null
          category_name: string | null
          city: string | null
          completed_count: number | null
          experience: string | null
          last_active_at: string | null
          name: string | null
          premium: boolean | null
          professional_id: string | null
          response_rate_pct: number | null
          response_time_display: string | null
          review_count: number | null
          state: string | null
          tags: Json | null
          trust_computed_at: string | null
          trust_score: number | null
          user_id: string | null
          verification_level:
            | Database["public"]["Enums"]["verification_level"]
            | null
          verified: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_professional_profiles_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_profiles_profile_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referral_leaderboard: {
        Row: {
          active_referrals: number | null
          category_name: string | null
          city: string | null
          full_name: string | null
          months_earned: number | null
          position: number | null
          total_referrals: number | null
          user_id: string | null
          verified: boolean | null
        }
        Relationships: []
      }
      referral_stats: {
        Row: {
          active_count: number | null
          clicks: number | null
          code: string | null
          fraud_count: number | null
          months_earned: number | null
          pending_count: number | null
          profile_complete_count: number | null
          ranking_days_earned: number | null
          total_referrals: number | null
          user_id: string | null
          visibility_days_earned: number | null
        }
        Relationships: []
      }
      slot_occupancy: {
        Row: {
          active_professionals: number | null
          available_slots: number | null
          category_id: string | null
          category_name: string | null
          city: string | null
          id: string | null
          max_professionals: number | null
          occupancy_pct: number | null
          status: string | null
          waiting_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_limits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      _score_professional: {
        Args: {
          p_category_id: string
          p_client_city: string
          p_user_id: string
        }
        Returns: number
      }
      apply_pending_rewards: { Args: { p_user_id: string }; Returns: undefined }
      apply_referral: {
        Args: {
          p_code: string
          p_fingerprint?: string
          p_referred_id: string
          p_referred_ip_hash?: string
        }
        Returns: string
      }
      apply_referral_safe: {
        Args: {
          p_code: string
          p_fingerprint?: string
          p_referred_id: string
          p_referred_ip_hash?: string
        }
        Returns: string
      }
      check_slot_available: {
        Args: { p_category_id: string; p_city: string }
        Returns: boolean
      }
      compute_trust_score: { Args: { p_user_id: string }; Returns: undefined }
      dispatch_broadcast_request: {
        Args: { p_broadcast_id: string }
        Returns: {
          professional_id: string
        }[]
      }
      expire_pending_dispatches: { Args: never; Returns: undefined }
      get_or_create_referral_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      handle_dispatch_response: {
        Args: { p_dispatch_id: string; p_response: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_waiting_list: {
        Args: { p_category_id: string; p_city: string }
        Returns: undefined
      }
      process_referral_milestone: {
        Args: { p_referred_id: string }
        Returns: undefined
      }
      record_user_ip: {
        Args: { p_ip_hash: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      user_type: "client" | "professional"
      verification_level: "basic" | "verified" | "top"
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
      app_role: ["admin", "moderator", "user"],
      user_type: ["client", "professional"],
      verification_level: ["basic", "verified", "top"],
    },
  },
} as const
