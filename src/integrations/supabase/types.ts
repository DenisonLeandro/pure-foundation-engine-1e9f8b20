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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_snapshots: {
        Row: {
          avg_comments: number | null
          avg_likes: number | null
          avg_views: number | null
          created_at: string
          display_name: string | null
          engagement_rate: number | null
          fetched_at: string
          followers: number | null
          following: number | null
          id: string
          platform: string
          posts_count: number | null
          profile_image_url: string | null
          raw_data: Json | null
          recent_posts: Json | null
          user_id: string | null
          username: string
        }
        Insert: {
          avg_comments?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          created_at?: string
          display_name?: string | null
          engagement_rate?: number | null
          fetched_at?: string
          followers?: number | null
          following?: number | null
          id?: string
          platform: string
          posts_count?: number | null
          profile_image_url?: string | null
          raw_data?: Json | null
          recent_posts?: Json | null
          user_id?: string | null
          username: string
        }
        Update: {
          avg_comments?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          created_at?: string
          display_name?: string | null
          engagement_rate?: number | null
          fetched_at?: string
          followers?: number | null
          following?: number | null
          id?: string
          platform?: string
          posts_count?: number | null
          profile_image_url?: string | null
          raw_data?: Json | null
          recent_posts?: Json | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      autopilot_calendars: {
        Row: {
          config_id: string
          created_at: string
          cycle_end: string
          cycle_start: string
          id: string
          research_results: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config_id: string
          created_at?: string
          cycle_end: string
          cycle_start: string
          id?: string
          research_results?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config_id?: string
          created_at?: string
          cycle_end?: string
          cycle_start?: string
          id?: string
          research_results?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_calendars_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "autopilot_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_configs: {
        Row: {
          brand_id: string | null
          content_types: string[] | null
          created_at: string
          id: string
          image_provider: string
          is_active: boolean
          last_run_at: string | null
          next_run_at: string | null
          platforms: string[]
          posts_per_cycle: number
          preferred_days: number[] | null
          preferred_times: string[] | null
          recurrence: string
          requires_approval: boolean
          research_topics: string[]
          research_urls: string[] | null
          social_account_ids: string[]
          timezone: string
          updated_at: string
          user_id: string
          video_model: string | null
          visual_format: string
        }
        Insert: {
          brand_id?: string | null
          content_types?: string[] | null
          created_at?: string
          id?: string
          image_provider?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          platforms?: string[]
          posts_per_cycle?: number
          preferred_days?: number[] | null
          preferred_times?: string[] | null
          recurrence?: string
          requires_approval?: boolean
          research_topics?: string[]
          research_urls?: string[] | null
          social_account_ids?: string[]
          timezone?: string
          updated_at?: string
          user_id: string
          video_model?: string | null
          visual_format?: string
        }
        Update: {
          brand_id?: string | null
          content_types?: string[] | null
          created_at?: string
          id?: string
          image_provider?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          platforms?: string[]
          posts_per_cycle?: number
          preferred_days?: number[] | null
          preferred_times?: string[] | null
          recurrence?: string
          requires_approval?: boolean
          research_topics?: string[]
          research_urls?: string[] | null
          social_account_ids?: string[]
          timezone?: string
          updated_at?: string
          user_id?: string
          video_model?: string | null
          visual_format?: string
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_configs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_posts: {
        Row: {
          calendar_id: string
          carousel_data: Json | null
          created_at: string
          error_message: string | null
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          pfm_post_id: string | null
          platform: string
          scheduled_at: string | null
          source_topic: string | null
          source_url: string | null
          status: string
          text_content: string
          updated_at: string
          user_id: string
          visual_creation_id: string | null
          visual_provider: string | null
        }
        Insert: {
          calendar_id: string
          carousel_data?: Json | null
          created_at?: string
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          pfm_post_id?: string | null
          platform: string
          scheduled_at?: string | null
          source_topic?: string | null
          source_url?: string | null
          status?: string
          text_content: string
          updated_at?: string
          user_id: string
          visual_creation_id?: string | null
          visual_provider?: string | null
        }
        Update: {
          calendar_id?: string
          carousel_data?: Json | null
          created_at?: string
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          pfm_post_id?: string | null
          platform?: string
          scheduled_at?: string | null
          source_topic?: string | null
          source_url?: string | null
          status?: string
          text_content?: string
          updated_at?: string
          user_id?: string
          visual_creation_id?: string | null
          visual_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_posts_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "autopilot_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          avoid_words: string[] | null
          colors: string[] | null
          company_id: string
          created_at: string
          description: string | null
          example_posts: string[] | null
          handle: string | null
          id: string
          industry: string | null
          is_default: boolean
          keywords: string[] | null
          logo_url: string | null
          name: string
          profile_photo_url: string | null
          social_links: Json | null
          system_prompt: string | null
          target_audience: string | null
          tone: string
          updated_at: string
          user_id: string | null
          values: string | null
          website: string | null
        }
        Insert: {
          avoid_words?: string[] | null
          colors?: string[] | null
          company_id: string
          created_at?: string
          description?: string | null
          example_posts?: string[] | null
          handle?: string | null
          id?: string
          industry?: string | null
          is_default?: boolean
          keywords?: string[] | null
          logo_url?: string | null
          name: string
          profile_photo_url?: string | null
          social_links?: Json | null
          system_prompt?: string | null
          target_audience?: string | null
          tone?: string
          updated_at?: string
          user_id?: string | null
          values?: string | null
          website?: string | null
        }
        Update: {
          avoid_words?: string[] | null
          colors?: string[] | null
          company_id?: string
          created_at?: string
          description?: string | null
          example_posts?: string[] | null
          handle?: string | null
          id?: string
          industry?: string | null
          is_default?: boolean
          keywords?: string[] | null
          logo_url?: string | null
          name?: string
          profile_photo_url?: string | null
          social_links?: Json | null
          system_prompt?: string | null
          target_audience?: string | null
          tone?: string
          updated_at?: string
          user_id?: string | null
          values?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          created_by: string
          id: string
          legacy_brand_profile_id: string | null
          logo_url: string | null
          name: string
          primary_color: string | null
          segment: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          legacy_brand_profile_id?: string | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          segment?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          legacy_brand_profile_id?: string | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          segment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_legacy_brand_profile_id_fkey"
            columns: ["legacy_brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_configs: {
        Row: {
          anthropic_api_key: string | null
          apify_api_token: string | null
          blotato_api_key: string | null
          company_id: string
          created_at: string
          firecrawl_api_key: string | null
          higgsfield_api_id: string | null
          higgsfield_api_secret: string | null
          id: string
          pexels_api_key: string | null
          postforme_api_key: string | null
          unsplash_api_key: string | null
          updated_at: string
        }
        Insert: {
          anthropic_api_key?: string | null
          apify_api_token?: string | null
          blotato_api_key?: string | null
          company_id: string
          created_at?: string
          firecrawl_api_key?: string | null
          higgsfield_api_id?: string | null
          higgsfield_api_secret?: string | null
          id?: string
          pexels_api_key?: string | null
          postforme_api_key?: string | null
          unsplash_api_key?: string | null
          updated_at?: string
        }
        Update: {
          anthropic_api_key?: string | null
          apify_api_token?: string | null
          blotato_api_key?: string | null
          company_id?: string
          created_at?: string
          firecrawl_api_key?: string | null
          higgsfield_api_id?: string | null
          higgsfield_api_secret?: string | null
          id?: string
          pexels_api_key?: string | null
          postforme_api_key?: string | null
          unsplash_api_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      creations: {
        Row: {
          caption: string | null
          created_at: string
          design_doc: Json | null
          doc: Json | null
          id: string
          metadata: Json | null
          prompt: string | null
          published: boolean
          source_id: string | null
          template_id: string | null
          template_name: string | null
          thumbnail_url: string | null
          type: string
          urls: string[]
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          design_doc?: Json | null
          doc?: Json | null
          id?: string
          metadata?: Json | null
          prompt?: string | null
          published?: boolean
          source_id?: string | null
          template_id?: string | null
          template_name?: string | null
          thumbnail_url?: string | null
          type?: string
          urls?: string[]
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          design_doc?: Json | null
          doc?: Json | null
          id?: string
          metadata?: Json | null
          prompt?: string | null
          published?: boolean
          source_id?: string | null
          template_id?: string | null
          template_name?: string | null
          thumbnail_url?: string | null
          type?: string
          urls?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      post_history: {
        Row: {
          account_id: string
          created_at: string
          error_message: string | null
          id: string
          media_urls: string[] | null
          platform: string
          post_submission_id: string | null
          public_url: string | null
          published_at: string | null
          scheduled_time: string | null
          status: string
          text_content: string | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          media_urls?: string[] | null
          platform: string
          post_submission_id?: string | null
          public_url?: string | null
          published_at?: string | null
          scheduled_time?: string | null
          status?: string
          text_content?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          media_urls?: string[] | null
          platform?: string
          post_submission_id?: string | null
          public_url?: string | null
          published_at?: string | null
          scheduled_time?: string | null
          status?: string
          text_content?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      saved_sources: {
        Row: {
          content: string | null
          created_at: string
          custom_instructions: string | null
          id: string
          reference_url: string | null
          source_type: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          custom_instructions?: string | null
          id?: string
          reference_url?: string | null
          source_type: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          custom_instructions?: string | null
          id?: string
          reference_url?: string | null
          source_type?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          registration_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          registration_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          registration_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_configs: {
        Row: {
          anthropic_api_key: string | null
          apify_api_token: string | null
          blotato_api_key: string | null
          brand_logo_url: string | null
          brand_name: string
          created_at: string
          firecrawl_api_key: string | null
          higgsfield_api_id: string | null
          higgsfield_api_secret: string | null
          id: string
          onboarding_completed: boolean
          pexels_api_key: string | null
          postforme_api_key: string | null
          unsplash_api_key: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anthropic_api_key?: string | null
          apify_api_token?: string | null
          blotato_api_key?: string | null
          brand_logo_url?: string | null
          brand_name?: string
          created_at?: string
          firecrawl_api_key?: string | null
          higgsfield_api_id?: string | null
          higgsfield_api_secret?: string | null
          id?: string
          onboarding_completed?: boolean
          pexels_api_key?: string | null
          postforme_api_key?: string | null
          unsplash_api_key?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anthropic_api_key?: string | null
          apify_api_token?: string | null
          blotato_api_key?: string | null
          brand_logo_url?: string | null
          brand_name?: string
          created_at?: string
          firecrawl_api_key?: string | null
          higgsfield_api_id?: string | null
          higgsfield_api_secret?: string | null
          id?: string
          onboarding_completed?: boolean
          pexels_api_key?: string | null
          postforme_api_key?: string | null
          unsplash_api_key?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_brand_profiles: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      can_manage_members: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      claim_owned_company: {
        Args: { _company_id: string }
        Returns: {
          company_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "company_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      count_active_owners: { Args: { _company: string }; Returns: number }
      get_company_configs_status: {
        Args: { _company_id: string }
        Returns: {
          has_apify: boolean
          has_blotato: boolean
          has_firecrawl: boolean
          has_higgsfield: boolean
          has_higgsfield_api_id: boolean
          has_higgsfield_api_secret: boolean
          has_pexels: boolean
          has_postforme: boolean
          updated_at: string
        }[]
      }
      get_company_keys_for_user: {
        Args: { _user_id: string }
        Returns: {
          anthropic_api_key: string | null
          apify_api_token: string | null
          blotato_api_key: string | null
          company_id: string
          created_at: string
          firecrawl_api_key: string | null
          higgsfield_api_id: string | null
          higgsfield_api_secret: string | null
          id: string
          pexels_api_key: string | null
          postforme_api_key: string | null
          unsplash_api_key: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "company_configs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_company_role: {
        Args: { _company: string; _user: string }
        Returns: string
      }
      get_vault_secret: { Args: { secret_name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      update_company_integration_keys: {
        Args: { _company_id: string; _patch: Json }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
