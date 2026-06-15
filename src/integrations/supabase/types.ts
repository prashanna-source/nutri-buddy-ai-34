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
      chat_messages: {
        Row: {
          ai_message_id: string | null
          created_at: string
          id: string
          parts: Json
          role: string
          user_id: string
        }
        Insert: {
          ai_message_id?: string | null
          created_at?: string
          id?: string
          parts?: Json
          role: string
          user_id: string
        }
        Update: {
          ai_message_id?: string | null
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_recommendations: {
        Row: {
          created_at: string
          id: string
          meals: Json
          rationale: string | null
          recommendation_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meals?: Json
          rationale?: string | null
          recommendation_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meals?: Json
          rationale?: string | null
          recommendation_date?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          accuracy_rating: number | null
          created_at: string
          ease_rating: number | null
          helpful: boolean | null
          id: string
          recipe_id: string
          suggestions: string | null
          taste_rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_rating?: number | null
          created_at?: string
          ease_rating?: number | null
          helpful?: boolean | null
          id?: string
          recipe_id: string
          suggestions?: string | null
          taste_rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_rating?: number | null
          created_at?: string
          ease_rating?: number | null
          helpful?: boolean | null
          id?: string
          recipe_id?: string
          suggestions?: string | null
          taste_rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          fat_g: number
          fiber_g: number
          id: string
          logged_on: string
          meal_name: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          protein_g: number
          recipe_id: string | null
          servings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          logged_on?: string
          meal_name: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          protein_g?: number
          recipe_id?: string | null
          servings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          logged_on?: string
          meal_name?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          protein_g?: number
          recipe_id?: string | null
          servings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_logs: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          detected_gaps: Json
          fat_g: number
          fiber_g: number
          id: string
          logged_on: string
          protein_g: number
          recommendations: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          detected_gaps?: Json
          fat_g?: number
          fiber_g?: number
          id?: string
          logged_on?: string
          protein_g?: number
          recommendations?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          detected_gaps?: Json
          fat_g?: number
          fiber_g?: number
          id?: string
          logged_on?: string
          protein_g?: number
          recommendations?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[]
          calorie_target: number
          carbs_target_g: number
          city: string
          country: string
          created_at: string
          cuisine_preferences: string[]
          custom_allergies: string[]
          custom_conditions: string[]
          custom_deficiencies: string[]
          deficiencies: string[]
          dietary_type: string | null
          fat_target_g: number
          fiber_target_g: number
          food_preferences: string[]
          full_name: string
          gender: string | null
          health_conditions: string[]
          health_goals: string[]
          height_cm: number | null
          id: string
          onboarding_completed: boolean
          protein_target_g: number
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[]
          calorie_target?: number
          carbs_target_g?: number
          city?: string
          country?: string
          created_at?: string
          cuisine_preferences?: string[]
          custom_allergies?: string[]
          custom_conditions?: string[]
          custom_deficiencies?: string[]
          deficiencies?: string[]
          dietary_type?: string | null
          fat_target_g?: number
          fiber_target_g?: number
          food_preferences?: string[]
          full_name?: string
          gender?: string | null
          health_conditions?: string[]
          health_goals?: string[]
          height_cm?: number | null
          id: string
          onboarding_completed?: boolean
          protein_target_g?: number
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[]
          calorie_target?: number
          carbs_target_g?: number
          city?: string
          country?: string
          created_at?: string
          cuisine_preferences?: string[]
          custom_allergies?: string[]
          custom_conditions?: string[]
          custom_deficiencies?: string[]
          deficiencies?: string[]
          dietary_type?: string | null
          fat_target_g?: number
          fiber_target_g?: number
          food_preferences?: string[]
          full_name?: string
          gender?: string | null
          health_conditions?: string[]
          health_goals?: string[]
          height_cm?: number | null
          id?: string
          onboarding_completed?: boolean
          protein_target_g?: number
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories: number
          carbs_g: number
          cooking_time_minutes: number
          created_at: string
          cuisine_type: string
          difficulty: string
          dish_name: string
          fat_g: number
          fiber_g: number
          generation_input: Json
          id: string
          image_url: string | null
          ingredients: Json
          instructions: Json
          liquid_alternative: Json | null
          meal_type: string
          protein_g: number
          servings: number
          updated_at: string
          user_id: string
          variations: Json
          youtube_query: string | null
        }
        Insert: {
          calories: number
          carbs_g: number
          cooking_time_minutes: number
          created_at?: string
          cuisine_type: string
          difficulty: string
          dish_name: string
          fat_g: number
          fiber_g: number
          generation_input?: Json
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          liquid_alternative?: Json | null
          meal_type: string
          protein_g: number
          servings?: number
          updated_at?: string
          user_id: string
          variations?: Json
          youtube_query?: string | null
        }
        Update: {
          calories?: number
          carbs_g?: number
          cooking_time_minutes?: number
          created_at?: string
          cuisine_type?: string
          difficulty?: string
          dish_name?: string
          fat_g?: number
          fiber_g?: number
          generation_input?: Json
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          liquid_alternative?: Json | null
          meal_type?: string
          protein_g?: number
          servings?: number
          updated_at?: string
          user_id?: string
          variations?: Json
          youtube_query?: string | null
        }
        Relationships: []
      }
      saved_recipes: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
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
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
    },
  },
} as const
