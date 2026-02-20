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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          admin_id: string
          admin_role: Database["public"]["Enums"]["admin_role"]
          created_at: string
          created_by: string | null
          is_active: boolean
          updated_at: string
        }
        Insert: {
          admin_id: string
          admin_role: Database["public"]["Enums"]["admin_role"]
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          admin_id?: string
          admin_role?: Database["public"]["Enums"]["admin_role"]
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_admin_id_profiles_profile_id_fk"
            columns: ["admin_id"]
            isOneToOne: true
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "admin_permissions_admin_id_profiles_profile_id_fk"
            columns: ["admin_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "admin_permissions_admin_id_profiles_profile_id_fk"
            columns: ["admin_id"]
            isOneToOne: true
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "admin_permissions_created_by_profiles_profile_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "admin_permissions_created_by_profiles_profile_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "admin_permissions_created_by_profiles_profile_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          key: string
          name: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          key: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      blog_post_upvotes: {
        Row: {
          post_id: number
          profile_id: string
        }
        Insert: {
          post_id: number
          profile_id: string
        }
        Update: {
          post_id?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_upvotes_post_id_blog_posts_meta_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts_meta"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "blog_post_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "blog_post_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "blog_post_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      blog_posts_meta: {
        Row: {
          author: string
          category: string
          created_at: string
          curation_notes: string | null
          date: string
          description: string
          email_sent: boolean | null
          imported_at: string | null
          is_curated: boolean | null
          is_published: boolean | null
          naver_blog_url: string | null
          naver_post_id: string | null
          post_id: number
          profile_id: string
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          upvotes: number | null
        }
        Insert: {
          author: string
          category: string
          created_at?: string
          curation_notes?: string | null
          date: string
          description: string
          email_sent?: boolean | null
          imported_at?: string | null
          is_curated?: boolean | null
          is_published?: boolean | null
          naver_blog_url?: string | null
          naver_post_id?: string | null
          post_id?: never
          profile_id: string
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          upvotes?: number | null
        }
        Update: {
          author?: string
          category?: string
          created_at?: string
          curation_notes?: string | null
          date?: string
          description?: string
          email_sent?: boolean | null
          imported_at?: string | null
          is_curated?: boolean | null
          is_published?: boolean | null
          naver_blog_url?: string | null
          naver_post_id?: string | null
          post_id?: never
          profile_id?: string
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_meta_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "blog_posts_meta_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "blog_posts_meta_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      blood_test_images: {
        Row: {
          created_at: string
          image_hash: string
          image_id: number
          image_url: string
          patient_id: string
          test_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          image_hash: string
          image_id?: never
          image_url: string
          patient_id: string
          test_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          image_hash?: string
          image_id?: never
          image_url?: string
          patient_id?: string
          test_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_test_images_patient_id_patient_health_profiles_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "blood_test_images_patient_id_patient_health_profiles_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_health_profiles"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      blood_test_results: {
        Row: {
          confidence: number | null
          created_at: string
          image_id: number | null
          notes: string | null
          patient_id: string
          result_id: number
          result_unit: string | null
          result_value: number
          test_date: string
          test_id: number
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          image_id?: number | null
          notes?: string | null
          patient_id: string
          result_id?: never
          result_unit?: string | null
          result_value: number
          test_date: string
          test_id: number
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          image_id?: number | null
          notes?: string | null
          patient_id?: string
          result_id?: never
          result_unit?: string | null
          result_value?: number
          test_date?: string
          test_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_test_results_image_id_blood_test_images_image_id_fk"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "blood_test_images"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "blood_test_results_patient_id_patient_health_profiles_patient_i"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "blood_test_results_patient_id_patient_health_profiles_patient_i"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_health_profiles"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "blood_test_results_test_id_blood_test_types_test_id_fk"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "blood_test_types"
            referencedColumns: ["test_id"]
          },
        ]
      }
      blood_test_types: {
        Row: {
          clinical_significance: string | null
          created_at: string
          descriptions: Json | null
          reference_max: number | null
          reference_min: number | null
          standard_name: string
          test_id: number
          unit: string
          updated_at: string
          variations: Json | null
        }
        Insert: {
          clinical_significance?: string | null
          created_at?: string
          descriptions?: Json | null
          reference_max?: number | null
          reference_min?: number | null
          standard_name: string
          test_id?: never
          unit: string
          updated_at?: string
          variations?: Json | null
        }
        Update: {
          clinical_significance?: string | null
          created_at?: string
          descriptions?: Json | null
          reference_max?: number | null
          reference_min?: number | null
          standard_name?: string
          test_id?: never
          unit?: string
          updated_at?: string
          variations?: Json | null
        }
        Relationships: []
      }
      bot_message_room_members: {
        Row: {
          bot_message_room_id: number
          created_at: string
          is_hidden: boolean
          joined_at: string
          left_at: string
          profile_id: string
        }
        Insert: {
          bot_message_room_id: number
          created_at?: string
          is_hidden?: boolean
          joined_at?: string
          left_at?: string
          profile_id: string
        }
        Update: {
          bot_message_room_id?: number
          created_at?: string
          is_hidden?: boolean
          joined_at?: string
          left_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_message_room_members_bot_message_room_id_bot_message_rooms_"
            columns: ["bot_message_room_id"]
            isOneToOne: false
            referencedRelation: "bot_message_rooms"
            referencedColumns: ["bot_message_room_id"]
          },
          {
            foreignKeyName: "bot_message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bot_message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bot_message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      bot_message_rooms: {
        Row: {
          bot_message_room_id: number
          conversation_id: string | null
          created_at: string
          created_by: string
          room_description: string | null
          room_name: string
        }
        Insert: {
          bot_message_room_id?: never
          conversation_id?: string | null
          created_at?: string
          created_by: string
          room_description?: string | null
          room_name?: string
        }
        Update: {
          bot_message_room_id?: never
          conversation_id?: string | null
          created_at?: string
          created_by?: string
          room_description?: string | null
          room_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_message_rooms_created_by_profiles_profile_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bot_message_rooms_created_by_profiles_profile_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bot_message_rooms_created_by_profiles_profile_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      bot_messages: {
        Row: {
          bot_message_id: number
          bot_message_room_id: number
          content: string
          created_at: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          bot_message_id?: never
          bot_message_room_id: number
          content: string
          created_at?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          bot_message_id?: never
          bot_message_room_id?: number
          content?: string
          created_at?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_messages_bot_message_room_id_bot_message_rooms_bot_message_"
            columns: ["bot_message_room_id"]
            isOneToOne: false
            referencedRelation: "bot_message_rooms"
            referencedColumns: ["bot_message_room_id"]
          },
        ]
      }
      categories: {
        Row: {
          academic_name: string
          category_id: number
          created_at: string
          description: string
          name: string
          target: string
          updated_at: string
        }
        Insert: {
          academic_name?: string
          category_id?: never
          created_at?: string
          description: string
          name: string
          target?: string
          updated_at?: string
        }
        Update: {
          academic_name?: string
          category_id?: never
          created_at?: string
          description?: string
          name?: string
          target?: string
          updated_at?: string
        }
        Relationships: []
      }
      checkpoint_blobs: {
        Row: {
          blob: string | null
          channel: string
          checkpoint_ns: string
          thread_id: string
          type: string
          version: string
        }
        Insert: {
          blob?: string | null
          channel: string
          checkpoint_ns?: string
          thread_id: string
          type: string
          version: string
        }
        Update: {
          blob?: string | null
          channel?: string
          checkpoint_ns?: string
          thread_id?: string
          type?: string
          version?: string
        }
        Relationships: []
      }
      checkpoint_migrations: {
        Row: {
          v: number
        }
        Insert: {
          v: number
        }
        Update: {
          v?: number
        }
        Relationships: []
      }
      checkpoint_writes: {
        Row: {
          blob: string
          channel: string
          checkpoint_id: string
          checkpoint_ns: string
          idx: number
          task_id: string
          task_path: string
          thread_id: string
          type: string | null
        }
        Insert: {
          blob: string
          channel: string
          checkpoint_id: string
          checkpoint_ns?: string
          idx: number
          task_id: string
          task_path?: string
          thread_id: string
          type?: string | null
        }
        Update: {
          blob?: string
          channel?: string
          checkpoint_id?: string
          checkpoint_ns?: string
          idx?: number
          task_id?: string
          task_path?: string
          thread_id?: string
          type?: string | null
        }
        Relationships: []
      }
      checkpoints: {
        Row: {
          checkpoint: Json
          checkpoint_id: string
          checkpoint_ns: string
          metadata: Json
          parent_checkpoint_id: string | null
          thread_id: string
          type: string | null
        }
        Insert: {
          checkpoint: Json
          checkpoint_id: string
          checkpoint_ns?: string
          metadata?: Json
          parent_checkpoint_id?: string | null
          thread_id: string
          type?: string | null
        }
        Update: {
          checkpoint?: Json
          checkpoint_id?: string
          checkpoint_ns?: string
          metadata?: Json
          parent_checkpoint_id?: string | null
          thread_id?: string
          type?: string | null
        }
        Relationships: []
      }
      clinic_photos: {
        Row: {
          clinic_id: number
          created_at: string
          file_name: string
          file_size: number
          is_primary: boolean
          mime_type: string
          photo_description: string | null
          photo_id: number
          photo_title: string | null
          photo_type: Database["public"]["Enums"]["photo_type"]
          photo_url: string
          updated_at: string
        }
        Insert: {
          clinic_id: number
          created_at?: string
          file_name: string
          file_size: number
          is_primary?: boolean
          mime_type: string
          photo_description?: string | null
          photo_id?: never
          photo_title?: string | null
          photo_type: Database["public"]["Enums"]["photo_type"]
          photo_url: string
          updated_at?: string
        }
        Update: {
          clinic_id?: number
          created_at?: string
          file_name?: string
          file_size?: number
          is_primary?: boolean
          mime_type?: string
          photo_description?: string | null
          photo_id?: never
          photo_title?: string | null
          photo_type?: Database["public"]["Enums"]["photo_type"]
          photo_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_photos_clinic_id_clinics_clinic_id_fk"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["clinic_id"]
          },
          {
            foreignKeyName: "clinic_photos_clinic_id_clinics_clinic_id_fk"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_view"
            referencedColumns: ["clinic_id"]
          },
        ]
      }
      clinic_reviews: {
        Row: {
          clinic_id: number
          created_at: string
          patient_friendliness: number
          profile_id: string
          rating: number
          review: string
          review_id: number
          updated_at: string
        }
        Insert: {
          clinic_id: number
          created_at?: string
          patient_friendliness?: number
          profile_id: string
          rating: number
          review: string
          review_id?: never
          updated_at?: string
        }
        Update: {
          clinic_id?: number
          created_at?: string
          patient_friendliness?: number
          profile_id?: string
          rating?: number
          review?: string
          review_id?: never
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_reviews_clinic_id_clinics_clinic_id_fk"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["clinic_id"]
          },
          {
            foreignKeyName: "clinic_reviews_clinic_id_clinics_clinic_id_fk"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_view"
            referencedColumns: ["clinic_id"]
          },
          {
            foreignKeyName: "clinic_reviews_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "clinic_reviews_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "clinic_reviews_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      clinics: {
        Row: {
          apply_url: string
          benefits: string
          clinic_boss: string | null
          clinic_id: number
          clinic_location: string
          clinic_logo: string
          clinic_name: string
          clinic_type: Database["public"]["Enums"]["clinic_type"]
          created_at: string
          level: Database["public"]["Enums"]["level"]
          location: Database["public"]["Enums"]["location"]
          overview: string
          position: string
          qualifications: string
          responsibilities: string
          skills: string
          updated_at: string
        }
        Insert: {
          apply_url: string
          benefits: string
          clinic_boss?: string | null
          clinic_id?: never
          clinic_location: string
          clinic_logo: string
          clinic_name: string
          clinic_type: Database["public"]["Enums"]["clinic_type"]
          created_at?: string
          level: Database["public"]["Enums"]["level"]
          location: Database["public"]["Enums"]["location"]
          overview: string
          position: string
          qualifications: string
          responsibilities: string
          skills: string
          updated_at?: string
        }
        Update: {
          apply_url?: string
          benefits?: string
          clinic_boss?: string | null
          clinic_id?: never
          clinic_location?: string
          clinic_logo?: string
          clinic_name?: string
          clinic_type?: Database["public"]["Enums"]["clinic_type"]
          created_at?: string
          level?: Database["public"]["Enums"]["level"]
          location?: Database["public"]["Enums"]["location"]
          overview?: string
          position?: string
          qualifications?: string
          responsibilities?: string
          skills?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinics_clinic_boss_profiles_profile_id_fk"
            columns: ["clinic_boss"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "clinics_clinic_boss_profiles_profile_id_fk"
            columns: ["clinic_boss"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "clinics_clinic_boss_profiles_profile_id_fk"
            columns: ["clinic_boss"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_id: string
          event_type: Database["public"]["Enums"]["event_type"] | null
          profile_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_id?: string
          event_type?: Database["public"]["Enums"]["event_type"] | null
          profile_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_id?: string
          event_type?: Database["public"]["Enums"]["event_type"] | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "events_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "events_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      evidence_sources: {
        Row: {
          authors: string | null
          candidates: Json | null
          cited: number | null
          created_at: string
          doi: string | null
          id: string
          journal: string | null
          pmid: string | null
          retrieved_at: string
          snippet: string | null
          source: string | null
          status: string | null
          strength: number
          study_type: string
          summary: string | null
          title: string | null
          updated_at: string
          url: string | null
          year: number | null
        }
        Insert: {
          authors?: string | null
          candidates?: Json | null
          cited?: number | null
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          pmid?: string | null
          retrieved_at?: string
          snippet?: string | null
          source?: string | null
          status?: string | null
          strength?: number
          study_type?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          url?: string | null
          year?: number | null
        }
        Update: {
          authors?: string | null
          candidates?: Json | null
          cited?: number | null
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          pmid?: string | null
          retrieved_at?: string
          snippet?: string | null
          source?: string | null
          status?: string | null
          strength?: number
          study_type?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          url?: string | null
          year?: number | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_profiles_profile_id_fk"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "follows_follower_id_profiles_profile_id_fk"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "follows_follower_id_profiles_profile_id_fk"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "follows_following_id_profiles_profile_id_fk"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "follows_following_id_profiles_profile_id_fk"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "follows_following_id_profiles_profile_id_fk"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      health_bookmarks: {
        Row: {
          bookmark_id: number
          bot_message_id: number | null
          bot_message_room_id: number | null
          content: Json
          created_at: string
          notes: string | null
          profile_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          bookmark_id?: never
          bot_message_id?: number | null
          bot_message_room_id?: number | null
          content: Json
          created_at?: string
          notes?: string | null
          profile_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          bookmark_id?: never
          bot_message_id?: number | null
          bot_message_room_id?: number | null
          content?: Json
          created_at?: string
          notes?: string | null
          profile_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_bookmarks_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "health_bookmarks_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "health_bookmarks_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      ingredient_target_evidence: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          notes: string | null
          strength: number
          study_type: string
          target_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          notes?: string | null
          strength?: number
          study_type?: string
          target_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          notes?: string | null
          strength?: number
          study_type?: string
          target_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_target_evidence_ingredient_id_natural_ingredients_id"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "natural_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_target_evidence_target_id_natural_targets_id_fk"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "natural_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_target_evidence_sources: {
        Row: {
          created_at: string
          evidence_source_id: string
          extracted_strength_override: number | null
          id: string
          ingredient_target_evidence_id: string
          is_primary: boolean
          note: string | null
        }
        Insert: {
          created_at?: string
          evidence_source_id: string
          extracted_strength_override?: number | null
          id?: string
          ingredient_target_evidence_id: string
          is_primary?: boolean
          note?: string | null
        }
        Update: {
          created_at?: string
          evidence_source_id?: string
          extracted_strength_override?: number | null
          id?: string
          ingredient_target_evidence_id?: string
          is_primary?: boolean
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_target_evidence_sources_evidence_source_id_evidence_"
            columns: ["evidence_source_id"]
            isOneToOne: false
            referencedRelation: "evidence_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_target_evidence_sources_ingredient_target_evidence_i"
            columns: ["ingredient_target_evidence_id"]
            isOneToOne: false
            referencedRelation: "ingredient_target_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_target_evidence_sources_ingredient_target_evidence_i"
            columns: ["ingredient_target_evidence_id"]
            isOneToOne: false
            referencedRelation: "ingredient_target_evidence_full_view"
            referencedColumns: ["evidence_id"]
          },
        ]
      }
      message_room_members: {
        Row: {
          created_at: string
          is_hidden: boolean
          is_read: boolean
          message_room_id: number
          profile_id: string
        }
        Insert: {
          created_at?: string
          is_hidden?: boolean
          is_read?: boolean
          message_room_id: number
          profile_id: string
        }
        Update: {
          created_at?: string
          is_hidden?: boolean
          is_read?: boolean
          message_room_id?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_room_members_message_room_id_message_rooms_message_room"
            columns: ["message_room_id"]
            isOneToOne: false
            referencedRelation: "message_rooms"
            referencedColumns: ["message_room_id"]
          },
          {
            foreignKeyName: "message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      message_rooms: {
        Row: {
          created_at: string
          message_room_id: number
        }
        Insert: {
          created_at?: string
          message_room_id?: never
        }
        Update: {
          created_at?: string
          message_room_id?: never
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          is_read: boolean
          message_id: number
          message_room_id: number
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          is_read?: boolean
          message_id?: never
          message_room_id: number
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          is_read?: boolean
          message_id?: never
          message_room_id?: number
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_message_room_id_message_rooms_message_room_id_fk"
            columns: ["message_room_id"]
            isOneToOne: false
            referencedRelation: "message_rooms"
            referencedColumns: ["message_room_id"]
          },
          {
            foreignKeyName: "messages_sender_id_profiles_profile_id_fk"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "messages_sender_id_profiles_profile_id_fk"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "messages_sender_id_profiles_profile_id_fk"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      natural_ingredients: {
        Row: {
          created_at: string
          display_name: string
          id: string
          slug: string
          synonyms: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          slug: string
          synonyms?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          slug?: string
          synonyms?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      natural_targets: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          notification_id: number
          post_id: number | null
          seen: boolean
          source_id: string | null
          target_id: string
          team_id: number | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          notification_id?: never
          post_id?: number | null
          seen?: boolean
          source_id?: string | null
          target_id: string
          team_id?: number | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          notification_id?: never
          post_id?: number | null
          seen?: boolean
          source_id?: string | null
          target_id?: string
          team_id?: number | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_post_detail"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "notifications_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_post_list_view"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "notifications_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "notifications_source_id_profiles_profile_id_fk"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_source_id_profiles_profile_id_fk"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_source_id_profiles_profile_id_fk"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_target_id_profiles_profile_id_fk"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_target_id_profiles_profile_id_fk"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_target_id_profiles_profile_id_fk"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_team_id_teams_team_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      patient_health_profiles: {
        Row: {
          age: number
          created_at: string
          disease: string
          disease_status: string | null
          gender: string
          height_cm: number
          medication_name: string | null
          medication_status: Database["public"]["Enums"]["patient_medication_status"]
          patient_id: string
          treatment_status: Database["public"]["Enums"]["patient_treatment_status"]
          updated_at: string
          weight_kg: number
        }
        Insert: {
          age: number
          created_at?: string
          disease: string
          disease_status?: string | null
          gender: string
          height_cm: number
          medication_name?: string | null
          medication_status?: Database["public"]["Enums"]["patient_medication_status"]
          patient_id: string
          treatment_status: Database["public"]["Enums"]["patient_treatment_status"]
          updated_at?: string
          weight_kg: number
        }
        Update: {
          age?: number
          created_at?: string
          disease?: string
          disease_status?: string | null
          gender?: string
          height_cm?: number
          medication_name?: string | null
          medication_status?: Database["public"]["Enums"]["patient_medication_status"]
          patient_id?: string
          treatment_status?: Database["public"]["Enums"]["patient_treatment_status"]
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "patient_health_profiles_patient_id_profiles_profile_id_fk"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "patient_health_profiles_patient_id_profiles_profile_id_fk"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "patient_health_profiles_patient_id_profiles_profile_id_fk"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      payments: {
        Row: {
          approved_at: string
          created_at: string
          metadata: Json
          order_id: string
          order_name: string
          payment_id: number
          payment_key: string
          profile_id: string
          raw_data: Json
          receipt_url: string
          requested_at: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at: string
          created_at?: string
          metadata: Json
          order_id: string
          order_name: string
          payment_id?: never
          payment_key: string
          profile_id: string
          raw_data: Json
          receipt_url: string
          requested_at: string
          status: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          approved_at?: string
          created_at?: string
          metadata?: Json
          order_id?: string
          order_name?: string
          payment_id?: never
          payment_key?: string
          profile_id?: string
          raw_data?: Json
          receipt_url?: string
          requested_at?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "payments_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "payments_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      point_payments: {
        Row: {
          approved_at: string
          created_at: string
          metadata: Json
          order_id: string
          order_name: string
          payment_id: number
          payment_key: string
          profile_id: string
          raw_data: Json
          receipt_url: string
          requested_at: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at: string
          created_at?: string
          metadata: Json
          order_id: string
          order_name: string
          payment_id?: never
          payment_key: string
          profile_id: string
          raw_data: Json
          receipt_url: string
          requested_at: string
          status: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          approved_at?: string
          created_at?: string
          metadata?: Json
          order_id?: string
          order_name?: string
          payment_id?: never
          payment_key?: string
          profile_id?: string
          raw_data?: Json
          receipt_url?: string
          requested_at?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_payments_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "point_payments_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "point_payments_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      post_replies: {
        Row: {
          created_at: string
          parent_id: number | null
          post_id: number | null
          post_reply_id: number
          profile_id: string
          reply: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          parent_id?: number | null
          post_id?: number | null
          post_reply_id?: never
          profile_id: string
          reply: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          parent_id?: number | null
          post_id?: number | null
          post_reply_id?: never
          profile_id?: string
          reply?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_replies_parent_id_post_replies_post_reply_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_replies"
            referencedColumns: ["post_reply_id"]
          },
          {
            foreignKeyName: "post_replies_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_post_detail"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_replies_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_post_list_view"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_replies_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_replies_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "post_replies_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "post_replies_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      post_reply_upvotes: {
        Row: {
          created_at: string
          post_reply_id: number
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          post_reply_id: number
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          post_reply_id?: number
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reply_upvotes_post_reply_id_post_replies_post_reply_id_fk"
            columns: ["post_reply_id"]
            isOneToOne: false
            referencedRelation: "post_replies"
            referencedColumns: ["post_reply_id"]
          },
          {
            foreignKeyName: "post_reply_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "post_reply_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "post_reply_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      post_upvotes: {
        Row: {
          post_id: number
          profile_id: string
        }
        Insert: {
          post_id: number
          profile_id: string
        }
        Update: {
          post_id?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_upvotes_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_post_detail"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_upvotes_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_post_list_view"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_upvotes_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "post_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "post_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          is_markdown: boolean | null
          is_notice: boolean | null
          post_id: number
          profile_id: string
          reference: string | null
          title: string
          topic_id: number
          updated_at: string
          upvotes: number | null
        }
        Insert: {
          content: string
          created_at?: string
          is_markdown?: boolean | null
          is_notice?: boolean | null
          post_id?: never
          profile_id: string
          reference?: string | null
          title: string
          topic_id: number
          updated_at?: string
          upvotes?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          is_markdown?: boolean | null
          is_notice?: boolean | null
          post_id?: never
          profile_id?: string
          reference?: string | null
          title?: string
          topic_id?: number
          updated_at?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "posts_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "posts_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "posts_topic_id_topics_topic_id_fk"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "community_post_detail"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "posts_topic_id_topics_topic_id_fk"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          product_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          product_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          product_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_natural_ingredients_id_fk"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "natural_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_products_product_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_list_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_products_product_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_overview_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_products_product_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_orders: {
        Row: {
          buyer: string | null
          created_at: string
          is_review_rewarded: boolean
          order_datetime: string
          order_number: string
          product_id: number
          product_name: string | null
          product_order_id: number
          profile_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          buyer?: string | null
          created_at?: string
          is_review_rewarded?: boolean
          order_datetime: string
          order_number: string
          product_id: number
          product_name?: string | null
          product_order_id?: number
          profile_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Update: {
          buyer?: string | null
          created_at?: string
          is_review_rewarded?: boolean
          order_datetime?: string
          order_number?: string
          product_id?: number
          product_name?: string | null
          product_order_id?: number
          profile_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_list_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_overview_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "product_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "product_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      product_upvotes: {
        Row: {
          product_id: number
          profile_id: string
        }
        Insert: {
          product_id: number
          profile_id: string
        }
        Update: {
          product_id?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_upvotes_product_id_products_product_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_list_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_upvotes_product_id_products_product_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_overview_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_upvotes_product_id_products_product_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "product_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "product_upvotes_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: number | null
          created_at: string
          description: string
          how_it_works: string
          name: string
          picture: string
          product_id: number
          profile_id: string
          promoted_from: string | null
          promoted_to: string | null
          stats: Json
          tagline: string
          updated_at: string
          url: string
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          description: string
          how_it_works: string
          name: string
          picture: string
          product_id?: never
          profile_id: string
          promoted_from?: string | null
          promoted_to?: string | null
          stats?: Json
          tagline: string
          updated_at?: string
          url: string
        }
        Update: {
          category_id?: number | null
          created_at?: string
          description?: string
          how_it_works?: string
          name?: string
          picture?: string
          product_id?: never
          profile_id?: string
          promoted_from?: string | null
          promoted_to?: string | null
          stats?: Json
          tagline?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_categories_category_id_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "products_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "products_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "products_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "products_to_profiles"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "products_to_profiles"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "products_to_profiles"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string
          email: string | null
          headline: string | null
          marketing_consent: boolean
          name: string
          points: number
          points_updated_at: string
          post_count: number
          profile_id: string
          role: Database["public"]["Enums"]["user_role"]
          stats: Json | null
          updated_at: string
          username: string
          views: Json | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          headline?: string | null
          marketing_consent?: boolean
          name: string
          points?: number
          points_updated_at?: string
          post_count?: number
          profile_id: string
          role?: Database["public"]["Enums"]["user_role"]
          stats?: Json | null
          updated_at?: string
          username: string
          views?: Json | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          headline?: string | null
          marketing_consent?: boolean
          name?: string
          points?: number
          points_updated_at?: string
          post_count?: number
          profile_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          stats?: Json | null
          updated_at?: string
          username?: string
          views?: Json | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          is_free: boolean
          program_address: string
          program_date_start: string
          program_description: string
          program_id: number
          program_image: string
          program_location: string
          program_name: string
          program_notice: string
          program_recruitment_end: string
          program_recruitment_start: string
          program_time_end: string
          program_time_start: string
          program_url: string
          topic_id: number
        }
        Insert: {
          created_at?: string
          is_free: boolean
          program_address: string
          program_date_start: string
          program_description: string
          program_id?: never
          program_image: string
          program_location: string
          program_name: string
          program_notice: string
          program_recruitment_end: string
          program_recruitment_start: string
          program_time_end: string
          program_time_start: string
          program_url: string
          topic_id: number
        }
        Update: {
          created_at?: string
          is_free?: boolean
          program_address?: string
          program_date_start?: string
          program_description?: string
          program_id?: never
          program_image?: string
          program_location?: string
          program_name?: string
          program_notice?: string
          program_recruitment_end?: string
          program_recruitment_start?: string
          program_time_end?: string
          program_time_start?: string
          program_url?: string
          topic_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "programs_topic_id_topics_topic_id_fk"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "community_post_detail"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "programs_topic_id_topics_topic_id_fk"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          product_id: number
          profile_id: string
          rating: number
          review: string
          review_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          product_id: number
          profile_id: string
          rating: number
          review: string
          review_id?: never
          updated_at?: string
        }
        Update: {
          created_at?: string
          product_id?: number
          profile_id?: string
          rating?: number
          review?: string
          review_id?: never
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_products_product_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_list_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "reviews_product_id_products_product_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_overview_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "reviews_product_id_products_product_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "reviews_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reviews_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reviews_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      routine_daily_grid_logs: {
        Row: {
          category: Database["public"]["Enums"]["habit_category"]
          created_at: string
          id: string
          log_date: string
          option_id: string | null
          template_id: string | null
          time_block: Database["public"]["Enums"]["habit_time_block"]
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["habit_category"]
          created_at?: string
          id?: string
          log_date: string
          option_id?: string | null
          template_id?: string | null
          time_block: Database["public"]["Enums"]["habit_time_block"]
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["habit_category"]
          created_at?: string
          id?: string
          log_date?: string
          option_id?: string | null
          template_id?: string | null
          time_block?: Database["public"]["Enums"]["habit_time_block"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_daily_grid_logs_option_id_routine_grid_options_id_fk"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "routine_grid_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_daily_grid_logs_template_id_routine_templates_id_fk"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "routine_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_grid_options: {
        Row: {
          category: Database["public"]["Enums"]["habit_category"]
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["grid_option_kind"]
          label: string
          sort_order: number
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["habit_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["grid_option_kind"]
          label: string
          sort_order?: number
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["habit_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["grid_option_kind"]
          label?: string
          sort_order?: number
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_grid_options_template_id_routine_templates_id_fk"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "routine_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_items: {
        Row: {
          amount_num: number | null
          amount_unit: string | null
          created_at: string
          id: string
          ingredient_id: string | null
          label: string
          meta: Json | null
          sort_order: number
          template_id: string
          updated_at: string
        }
        Insert: {
          amount_num?: number | null
          amount_unit?: string | null
          created_at?: string
          id?: string
          ingredient_id?: string | null
          label: string
          meta?: Json | null
          sort_order?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          amount_num?: number | null
          amount_unit?: string | null
          created_at?: string
          id?: string
          ingredient_id?: string | null
          label?: string
          meta?: Json | null
          sort_order?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_items_ingredient_id_natural_ingredients_id_fk"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "natural_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_items_template_id_routine_templates_id_fk"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "routine_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          section_type: Database["public"]["Enums"]["habit_category"]
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          section_type: Database["public"]["Enums"]["habit_category"]
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          section_type?: Database["public"]["Enums"]["habit_category"]
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number
          last_log_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_log_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_log_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      target_to_meta_axis: {
        Row: {
          axis_weight: number
          meta_axis: string
          target_id: string
        }
        Insert: {
          axis_weight?: number
          meta_axis: string
          target_id: string
        }
        Update: {
          axis_weight?: number
          meta_axis?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_to_meta_axis_target_id_natural_targets_id_fk"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "natural_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          cost: number
          created_at: string
          target: string
          team_description: string
          team_id: number
          team_leader_id: string
          team_name: string
          team_position: Database["public"]["Enums"]["team_position"]
          team_size: number
          updated_at: string
        }
        Insert: {
          cost: number
          created_at?: string
          target: string
          team_description: string
          team_id?: never
          team_leader_id: string
          team_name: string
          team_position: Database["public"]["Enums"]["team_position"]
          team_size: number
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          target?: string
          team_description?: string
          team_id?: never
          team_leader_id?: string
          team_name?: string
          team_position?: Database["public"]["Enums"]["team_position"]
          team_size?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_team_leader_id_profiles_profile_id_fk"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "teams_team_leader_id_profiles_profile_id_fk"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "teams_team_leader_id_profiles_profile_id_fk"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          name: string
          slug: string
          topic_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          name: string
          slug: string
          topic_id?: never
          updated_at?: string
        }
        Update: {
          created_at?: string
          name?: string
          slug?: string
          topic_id?: never
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_badges_id_fk"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      blood_test_results_summary_view: {
        Row: {
          clinical_significance: string | null
          confidence: number | null
          image_id: number | null
          is_out_of_range: boolean | null
          notes: string | null
          patient_id: string | null
          reference_max: number | null
          reference_min: number | null
          result_created_at: string | null
          result_id: number | null
          result_unit: string | null
          result_updated_at: string | null
          result_value: number | null
          standard_name: string | null
          test_date: string | null
          test_id: number | null
          type_descriptions: Json | null
          type_unit: string | null
          type_variations: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_test_results_image_id_blood_test_images_image_id_fk"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "blood_test_images"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "blood_test_results_patient_id_patient_health_profiles_patient_i"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "blood_test_results_patient_id_patient_health_profiles_patient_i"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_health_profiles"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "blood_test_results_test_id_blood_test_types_test_id_fk"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "blood_test_types"
            referencedColumns: ["test_id"]
          },
        ]
      }
      bot_messages_view: {
        Row: {
          avatar: string | null
          bot_message_room_id: number | null
          last_message: string | null
          last_time: string | null
          name: string | null
          other_profile_id: string | null
          profile_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_message_room_members_bot_message_room_id_bot_message_rooms_"
            columns: ["bot_message_room_id"]
            isOneToOne: false
            referencedRelation: "bot_message_rooms"
            referencedColumns: ["bot_message_room_id"]
          },
          {
            foreignKeyName: "bot_message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["other_profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bot_message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bot_message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["other_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bot_message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bot_message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["other_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bot_message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      clinics_view: {
        Row: {
          apply_url: string | null
          benefits: string | null
          clinic_boss: string | null
          clinic_id: number | null
          clinic_location: string | null
          clinic_logo: string | null
          clinic_name: string | null
          clinic_type: Database["public"]["Enums"]["clinic_type"] | null
          created_at: string | null
          level: Database["public"]["Enums"]["level"] | null
          location: Database["public"]["Enums"]["location"] | null
          overview: string | null
          photo_count: number | null
          position: string | null
          primary_photo_description: string | null
          primary_photo_title: string | null
          primary_photo_type: Database["public"]["Enums"]["photo_type"] | null
          primary_photo_url: string | null
          qualifications: string | null
          responsibilities: string | null
          skills: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinics_clinic_boss_profiles_profile_id_fk"
            columns: ["clinic_boss"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "clinics_clinic_boss_profiles_profile_id_fk"
            columns: ["clinic_boss"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "clinics_clinic_boss_profiles_profile_id_fk"
            columns: ["clinic_boss"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      community_post_detail: {
        Row: {
          author_avatar: string | null
          author_created_at: string | null
          author_is_following: boolean | null
          author_name: string | null
          author_profile_id: string | null
          author_role: Database["public"]["Enums"]["user_role"] | null
          author_username: string | null
          content: string | null
          created_at: string | null
          is_markdown: boolean | null
          is_upvoted: boolean | null
          post_id: number | null
          products: number | null
          reference: string | null
          replies: number | null
          title: string | null
          topic_id: number | null
          topic_name: string | null
          topic_slug: string | null
          upvotes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_profile_id_profiles_profile_id_fk"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "posts_profile_id_profiles_profile_id_fk"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "posts_profile_id_profiles_profile_id_fk"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      community_post_list_view: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          author_username: string | null
          created_at: string | null
          is_markdown: boolean | null
          is_upvoted: boolean | null
          post_id: number | null
          title: string | null
          topic: string | null
          topic_slug: string | null
          upvotes: number | null
        }
        Relationships: []
      }
      health_profiles_view: {
        Row: {
          age: number | null
          bmi: number | null
          clinical_significance: string | null
          confidence: number | null
          disease: string | null
          disease_status: string | null
          gender: string | null
          health_profile_created_at: string | null
          health_profile_updated_at: string | null
          height_cm: number | null
          image_created_at: string | null
          image_hash: string | null
          image_id: number | null
          image_test_date: string | null
          image_url: string | null
          is_out_of_range: boolean | null
          medication_name: string | null
          medication_status:
            | Database["public"]["Enums"]["patient_medication_status"]
            | null
          notes: string | null
          patient_avatar: string | null
          patient_bio: string | null
          patient_email: string | null
          patient_headline: string | null
          patient_id: string | null
          patient_name: string | null
          patient_role: Database["public"]["Enums"]["user_role"] | null
          patient_username: string | null
          profile_created_at: string | null
          profile_id: string | null
          profile_updated_at: string | null
          reference_max: number | null
          reference_min: number | null
          result_created_at: string | null
          result_id: number | null
          result_unit: string | null
          result_updated_at: string | null
          result_value: number | null
          standard_name: string | null
          test_date: string | null
          test_id: number | null
          treatment_status:
            | Database["public"]["Enums"]["patient_treatment_status"]
            | null
          type_created_at: string | null
          type_descriptions: Json | null
          type_unit: string | null
          type_updated_at: string | null
          type_variations: Json | null
          weight_kg: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_test_results_image_id_blood_test_images_image_id_fk"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "blood_test_images"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "blood_test_results_test_id_blood_test_types_test_id_fk"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "blood_test_types"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "patient_health_profiles_patient_id_profiles_profile_id_fk"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "patient_health_profiles_patient_id_profiles_profile_id_fk"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "patient_health_profiles_patient_id_profiles_profile_id_fk"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      ingredient_target_evidence_full_view: {
        Row: {
          axis_weight: number | null
          evidence_count: number | null
          evidence_created_at: string | null
          evidence_id: string | null
          evidence_notes: string | null
          evidence_updated_at: string | null
          ingredient_id: string | null
          ingredient_name: string | null
          ingredient_slug: string | null
          meta_axis: string | null
          primary_evidence_count: number | null
          strength: number | null
          study_type: string | null
          target_description: string | null
          target_id: string | null
          target_name: string | null
          target_slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_target_evidence_ingredient_id_natural_ingredients_id"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "natural_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_target_evidence_target_id_natural_targets_id_fk"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "natural_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_view: {
        Row: {
          avatar: string | null
          is_read: boolean | null
          last_message: string | null
          last_time: string | null
          message_room_id: number | null
          name: string | null
          other_profile_id: string | null
          profile_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_room_members_message_room_id_message_rooms_message_room"
            columns: ["message_room_id"]
            isOneToOne: false
            referencedRelation: "message_rooms"
            referencedColumns: ["message_room_id"]
          },
          {
            foreignKeyName: "message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["other_profile_id"]
            isOneToOne: false
            referencedRelation: "health_profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["other_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "message_room_members_profile_id_profiles_profile_id_fk"
            columns: ["other_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      product_list_view: {
        Row: {
          created_at: string | null
          is_upvoted: boolean | null
          name: string | null
          product_id: number | null
          promoted_from: string | null
          reviews: string | null
          stats: Json | null
          tagline: string | null
          upvotes: string | null
          views: string | null
        }
        Insert: {
          created_at?: string | null
          is_upvoted?: never
          name?: string | null
          product_id?: number | null
          promoted_from?: string | null
          reviews?: never
          stats?: Json | null
          tagline?: string | null
          upvotes?: never
          views?: never
        }
        Update: {
          created_at?: string | null
          is_upvoted?: never
          name?: string | null
          product_id?: number | null
          promoted_from?: string | null
          reviews?: never
          stats?: Json | null
          tagline?: string | null
          upvotes?: never
          views?: never
        }
        Relationships: []
      }
      product_overview_view: {
        Row: {
          average_rating: number | null
          description: string | null
          how_it_works: string | null
          is_upvoted: boolean | null
          name: string | null
          picture: string | null
          product_id: number | null
          reviews: string | null
          tagline: string | null
          upvotes: string | null
          url: string | null
          views: string | null
        }
        Relationships: []
      }
      profiles_view: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          headline: string | null
          is_following: boolean | null
          marketing_consent: boolean | null
          name: string | null
          points: number | null
          points_updated_at: string | null
          profile_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          stats: Json | null
          updated_at: string | null
          username: string | null
          views: Json | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          headline?: string | null
          is_following?: never
          marketing_consent?: boolean | null
          name?: string | null
          points?: number | null
          points_updated_at?: string | null
          profile_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          stats?: Json | null
          updated_at?: string | null
          username?: string | null
          views?: Json | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          headline?: string | null
          is_following?: never
          marketing_consent?: boolean | null
          name?: string | null
          points?: number | null
          points_updated_at?: string | null
          profile_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          stats?: Json | null
          updated_at?: string | null
          username?: string | null
          views?: Json | null
        }
        Relationships: []
      }
      routine_daily_scores_view: {
        Row: {
          category: Database["public"]["Enums"]["habit_category"] | null
          last_recorded_at: string | null
          log_date: string | null
          record_count: number | null
          time_blocks_count: number | null
          unique_options_count: number | null
          unique_templates_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_invite_before_first_message: {
        Args: { p_inviter_id: string; p_room_id: number }
        Returns: boolean
      }
      get_bot_room: {
        Args: { user_id: string }
        Returns: {
          bot_message_room_id: number
        }[]
      }
      get_message_rooms_for_user: {
        Args: { user_id: string }
        Returns: number[]
      }
      get_messages_rooms_for_user: {
        Args: { profile_id: string }
        Returns: number[]
      }
      get_or_create_dm_room_and_send: {
        Args: { p_content: string; p_to_user_id: string }
        Returns: {
          message_id: number
          message_room_id: number
        }[]
      }
      get_product_stats: {
        Args: { user_id: string }
        Returns: {
          month: string
          views: number
        }[]
      }
      get_room: {
        Args: { from_user_id: string; to_user_id: string }
        Returns: {
          message_room_id: number
        }[]
      }
      is_bot_user_member: {
        Args: { p_profile_id: string; p_room_id: number }
        Returns: boolean
      }
      is_user_member: {
        Args: { p_profile_id: string; p_room_id: number }
        Returns: boolean
      }
      recompute_primary_for_ite: {
        Args: { p_ite_id: string }
        Returns: undefined
      }
      study_type_rank: { Args: { study_type: string }; Returns: number }
      track_event: {
        Args: {
          event_data: Json
          event_type: Database["public"]["Enums"]["event_type"]
          profile_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      admin_role:
        | "super_admin"
        | "content_admin"
        | "user_admin"
        | "product_admin"
        | "clinic_admin"
      clinic_type: "university" | "functional" | "nursing" | "traditional"
      event_type: "product_view" | "product_visit" | "profile_view"
      grid_option_kind: "preset" | "template"
      habit_category: "exercise" | "sleep" | "supplement" | "diet" | "therapy"
      habit_time_block: "am" | "noon" | "pm" | "bed"
      habit_time_slot: "am" | "noon" | "pm" | "bed"
      level: "1" | "2" | "3" | "4" | "5"
      location:
        | "seoul"
        | "busan"
        | "daegu"
        | "incheon"
        | "gwangju"
        | "daejeon"
        | "ulsan"
        | "sejong"
        | "gyeonggi"
        | "gangwon"
        | "chungbuk"
        | "chungnam"
        | "jeonbuk"
        | "jeonnam"
        | "gyeongbuk"
        | "gyeongnam"
        | "jeju"
      notification_type: "follow" | "review" | "reply"
      patient_medication_status: "none" | "active"
      patient_treatment_status: "ongoing" | "completed" | "follow_up"
      photo_type:
        | "logo"
        | "exterior"
        | "interior"
        | "equipment"
        | "staff"
        | "other"
      team_position: "doctor" | "nurse" | "nutritionist" | "foresttherapist"
      user_role:
        | "healthy"
        | "patient"
        | "caregiver"
        | "doctor"
        | "health_exp"
        | "other"
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
      admin_role: [
        "super_admin",
        "content_admin",
        "user_admin",
        "product_admin",
        "clinic_admin",
      ],
      clinic_type: ["university", "functional", "nursing", "traditional"],
      event_type: ["product_view", "product_visit", "profile_view"],
      grid_option_kind: ["preset", "template"],
      habit_category: ["exercise", "sleep", "supplement", "diet", "therapy"],
      habit_time_block: ["am", "noon", "pm", "bed"],
      habit_time_slot: ["am", "noon", "pm", "bed"],
      level: ["1", "2", "3", "4", "5"],
      location: [
        "seoul",
        "busan",
        "daegu",
        "incheon",
        "gwangju",
        "daejeon",
        "ulsan",
        "sejong",
        "gyeonggi",
        "gangwon",
        "chungbuk",
        "chungnam",
        "jeonbuk",
        "jeonnam",
        "gyeongbuk",
        "gyeongnam",
        "jeju",
      ],
      notification_type: ["follow", "review", "reply"],
      patient_medication_status: ["none", "active"],
      patient_treatment_status: ["ongoing", "completed", "follow_up"],
      photo_type: [
        "logo",
        "exterior",
        "interior",
        "equipment",
        "staff",
        "other",
      ],
      team_position: ["doctor", "nurse", "nutritionist", "foresttherapist"],
      user_role: [
        "healthy",
        "patient",
        "caregiver",
        "doctor",
        "health_exp",
        "other",
      ],
    },
  },
} as const
