export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: string;
          author_id: string;
          body: string;
          created_at: string;
          estate_id: string;
          expires_at: string | null;
          id: string;
          priority: Database["public"]["Enums"]["announcement_priority"];
          published_at: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          audience?: string;
          author_id: string;
          body: string;
          created_at?: string;
          estate_id: string;
          expires_at?: string | null;
          id?: string;
          priority?: Database["public"]["Enums"]["announcement_priority"];
          published_at?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          audience?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
          estate_id?: string;
          expires_at?: string | null;
          id?: string;
          priority?: Database["public"]["Enums"]["announcement_priority"];
          published_at?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
        ];
      };
      announcement_recipients: {
        Row: {
          announcement_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          announcement_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          announcement_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcement_recipients_announcement_id_fkey";
            columns: ["announcement_id"];
            isOneToOne: false;
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity: string | null;
          entity_id: string | null;
          estate_id: string | null;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity?: string | null;
          entity_id?: string | null;
          estate_id?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity?: string | null;
          entity_id?: string | null;
          estate_id?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
        ];
      };
      complaints: {
        Row: {
          assignee_id: string | null;
          category: string | null;
          created_at: string;
          description: string | null;
          estate_id: string;
          id: string;
          priority: Database["public"]["Enums"]["complaint_priority"];
          reporter_id: string;
          resolution_notes: string | null;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["complaint_status"];
          subject: string;
          updated_at: string;
        };
        Insert: {
          assignee_id?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          estate_id: string;
          id?: string;
          priority?: Database["public"]["Enums"]["complaint_priority"];
          reporter_id: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["complaint_status"];
          subject: string;
          updated_at?: string;
        };
        Update: {
          assignee_id?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          estate_id?: string;
          id?: string;
          priority?: Database["public"]["Enums"]["complaint_priority"];
          reporter_id?: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["complaint_status"];
          subject?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "complaints_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          category: string | null;
          created_at: string;
          estate_id: string;
          file_url: string;
          id: string;
          mime_type: string | null;
          name: string;
          property_id: string | null;
          resident_id: string | null;
          scope: Database["public"]["Enums"]["document_scope"];
          size_bytes: number | null;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          estate_id: string;
          file_url: string;
          id?: string;
          mime_type?: string | null;
          name: string;
          property_id?: string | null;
          resident_id?: string | null;
          scope?: Database["public"]["Enums"]["document_scope"];
          size_bytes?: number | null;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          estate_id?: string;
          file_url?: string;
          id?: string;
          mime_type?: string | null;
          name?: string;
          property_id?: string | null;
          resident_id?: string | null;
          scope?: Database["public"]["Enums"]["document_scope"];
          size_bytes?: number | null;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      emergency_contacts: {
        Row: {
          address: string | null;
          created_at: string;
          created_by: string | null;
          estate_id: string;
          id: string;
          label: string;
          notes: string | null;
          phone: string;
          priority: number;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          estate_id: string;
          id?: string;
          label: string;
          notes?: string | null;
          phone: string;
          priority?: number;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          estate_id?: string;
          id?: string;
          label?: string;
          notes?: string | null;
          phone?: string;
          priority?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
        ];
      };
      estates: {
        Row: {
          address: string | null;
          city: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          country: string | null;
          created_at: string;
          id: string;
          logo_url: string | null;
          name: string;
          slug: string | null;
          state: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name: string;
          slug?: string | null;
          state?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          slug?: string | null;
          state?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          created_at: string;
          date_of_birth: string | null;
          estate_id: string;
          full_name: string;
          household_id: string;
          id: string;
          member_type: Database["public"]["Enums"]["member_type"];
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date_of_birth?: string | null;
          estate_id: string;
          full_name: string;
          household_id: string;
          id?: string;
          member_type?: Database["public"]["Enums"]["member_type"];
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date_of_birth?: string | null;
          estate_id?: string;
          full_name?: string;
          household_id?: string;
          id?: string;
          member_type?: Database["public"]["Enums"]["member_type"];
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "household_members_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "household_members_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };
      households: {
        Row: {
          created_at: string;
          estate_id: string;
          id: string;
          move_in_date: string | null;
          move_out_date: string | null;
          primary_resident_id: string | null;
          property_id: string;
          resident_type: Database["public"]["Enums"]["resident_type"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          estate_id: string;
          id?: string;
          move_in_date?: string | null;
          move_out_date?: string | null;
          primary_resident_id?: string | null;
          property_id: string;
          resident_type?: Database["public"]["Enums"]["resident_type"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          estate_id?: string;
          id?: string;
          move_in_date?: string | null;
          move_out_date?: string | null;
          primary_resident_id?: string | null;
          property_id?: string;
          resident_type?: Database["public"]["Enums"]["resident_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "households_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "households_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          amount: number;
          amount_paid: number;
          created_at: string;
          currency: string;
          description: string | null;
          due_date: string | null;
          estate_id: string;
          id: string;
          invoice_number: string;
          line_items: Json;
          period_end: string | null;
          period_start: string | null;
          property_id: string | null;
          resident_id: string;
          status: Database["public"]["Enums"]["invoice_status"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          amount_paid?: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          due_date?: string | null;
          estate_id: string;
          id?: string;
          invoice_number: string;
          line_items?: Json;
          period_end?: string | null;
          period_start?: string | null;
          property_id?: string | null;
          resident_id: string;
          status?: Database["public"]["Enums"]["invoice_status"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          amount_paid?: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          due_date?: string | null;
          estate_id?: string;
          id?: string;
          invoice_number?: string;
          line_items?: Json;
          period_end?: string | null;
          period_start?: string | null;
          property_id?: string | null;
          resident_id?: string;
          status?: Database["public"]["Enums"]["invoice_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          estate_id: string | null;
          id: string;
          link: string | null;
          read_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          estate_id?: string | null;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          estate_id?: string | null;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          estate_id: string;
          id: string;
          invoice_id: string | null;
          method: Database["public"]["Enums"]["payment_method"];
          notes: string | null;
          paid_at: string | null;
          reference: string | null;
          resident_id: string;
          status: Database["public"]["Enums"]["payment_status"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          estate_id: string;
          id?: string;
          invoice_id?: string | null;
          method?: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          paid_at?: string | null;
          reference?: string | null;
          resident_id: string;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          estate_id?: string;
          id?: string;
          invoice_id?: string | null;
          method?: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          paid_at?: string | null;
          reference?: string | null;
          resident_id?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          estate_id: string | null;
          full_name: string | null;
          id: string;
          onboarding_completed: boolean;
          onboarding_completed_at: string | null;
          onboarding_data: Json;
          phone: string | null;
          resident_type: Database["public"]["Enums"]["resident_type"] | null;
          status: string;
          updated_at: string;
          whatsapp_number: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          estate_id?: string | null;
          full_name?: string | null;
          id: string;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          onboarding_data?: Json;
          phone?: string | null;
          resident_type?: Database["public"]["Enums"]["resident_type"] | null;
          status?: string;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          estate_id?: string | null;
          full_name?: string | null;
          id?: string;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          onboarding_data?: Json;
          phone?: string | null;
          resident_type?: Database["public"]["Enums"]["resident_type"] | null;
          status?: string;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
        ];
      };
      properties: {
        Row: {
          apartment_name: string | null;
          bathrooms: number | null;
          bedrooms: number | null;
          compound_name: string | null;
          created_at: string;
          electricity_meter: string | null;
          estate_id: string;
          house_number: string;
          id: string;
          notes: string | null;
          occupant_capacity: number | null;
          property_type: Database["public"]["Enums"]["property_type"];
          status: Database["public"]["Enums"]["property_status"];
          street: string | null;
          updated_at: string;
          water_meter: string | null;
        };
        Insert: {
          apartment_name?: string | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          compound_name?: string | null;
          created_at?: string;
          electricity_meter?: string | null;
          estate_id: string;
          house_number: string;
          id?: string;
          notes?: string | null;
          occupant_capacity?: number | null;
          property_type?: Database["public"]["Enums"]["property_type"];
          status?: Database["public"]["Enums"]["property_status"];
          street?: string | null;
          updated_at?: string;
          water_meter?: string | null;
        };
        Update: {
          apartment_name?: string | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          compound_name?: string | null;
          created_at?: string;
          electricity_meter?: string | null;
          estate_id?: string;
          house_number?: string;
          id?: string;
          notes?: string | null;
          occupant_capacity?: number | null;
          property_type?: Database["public"]["Enums"]["property_type"];
          status?: Database["public"]["Enums"]["property_status"];
          street?: string | null;
          updated_at?: string;
          water_meter?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "properties_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
        ];
      };
      property_occupants: {
        Row: {
          created_at: string;
          estate_id: string;
          full_name: string;
          id: string;
          is_primary: boolean;
          is_current: boolean;
          landlord_name: string | null;
          landlord_phone: string | null;
          move_in_date: string | null;
          move_out_date: string | null;
          notes: string | null;
          occupant_type: Database["public"]["Enums"]["resident_type"] | null;
          phone: string | null;
          property_id: string;
          resident_id: string | null;
          stay_duration: string | null;
          updated_at: string;
          whatsapp_number: string | null;
        };
        Insert: {
          created_at?: string;
          estate_id: string;
          full_name: string;
          id?: string;
          is_primary?: boolean;
          is_current?: boolean;
          landlord_name?: string | null;
          landlord_phone?: string | null;
          move_in_date?: string | null;
          move_out_date?: string | null;
          notes?: string | null;
          occupant_type?: Database["public"]["Enums"]["resident_type"] | null;
          phone?: string | null;
          property_id: string;
          resident_id?: string | null;
          stay_duration?: string | null;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Update: {
          created_at?: string;
          estate_id?: string;
          full_name?: string;
          id?: string;
          is_primary?: boolean;
          is_current?: boolean;
          landlord_name?: string | null;
          landlord_phone?: string | null;
          move_in_date?: string | null;
          move_out_date?: string | null;
          notes?: string | null;
          occupant_type?: Database["public"]["Enums"]["resident_type"] | null;
          phone?: string | null;
          property_id?: string;
          resident_id?: string | null;
          stay_duration?: string | null;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_occupants_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_occupants_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      security_incidents: {
        Row: {
          created_at: string;
          description: string | null;
          estate_id: string;
          id: string;
          location: string | null;
          occurred_at: string | null;
          reporter_id: string;
          severity: Database["public"]["Enums"]["incident_severity"];
          status: Database["public"]["Enums"]["incident_status"];
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          estate_id: string;
          id?: string;
          location?: string | null;
          occurred_at?: string | null;
          reporter_id: string;
          severity?: Database["public"]["Enums"]["incident_severity"];
          status?: Database["public"]["Enums"]["incident_status"];
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          estate_id?: string;
          id?: string;
          location?: string | null;
          occurred_at?: string | null;
          reporter_id?: string;
          severity?: Database["public"]["Enums"]["incident_severity"];
          status?: Database["public"]["Enums"]["incident_status"];
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "security_incidents_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_tasks: {
        Row: {
          assigned_role: Database["public"]["Enums"]["app_role"] | null;
          assigned_user_id: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          due_date: string | null;
          estate_id: string;
          id: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null;
          assigned_user_id?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          due_date?: string | null;
          estate_id: string;
          id?: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null;
          assigned_user_id?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          due_date?: string | null;
          estate_id?: string;
          id?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_tasks_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          estate_id: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          estate_id?: string | null;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          estate_id?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_invitations: {
        Row: {
          accepted_at: string | null;
          email: string;
          estate_id: string;
          id: string;
          invited_at: string;
          invited_by: string | null;
          note: string | null;
          role: Database["public"]["Enums"]["app_role"];
          status: string;
          user_id: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          email: string;
          estate_id: string;
          id?: string;
          invited_at?: string;
          invited_by?: string | null;
          note?: string | null;
          role: Database["public"]["Enums"]["app_role"];
          status?: string;
          user_id?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          email?: string;
          estate_id?: string;
          id?: string;
          invited_at?: string;
          invited_by?: string | null;
          note?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_invitations_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicles: {
        Row: {
          color: string | null;
          created_at: string;
          estate_id: string;
          household_id: string | null;
          id: string;
          is_active: boolean;
          make: string | null;
          model: string | null;
          owner_id: string | null;
          plate_number: string;
          updated_at: string;
          year: number | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          estate_id: string;
          household_id?: string | null;
          id?: string;
          is_active?: boolean;
          make?: string | null;
          model?: string | null;
          owner_id?: string | null;
          plate_number: string;
          updated_at?: string;
          year?: number | null;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          estate_id?: string;
          household_id?: string | null;
          id?: string;
          is_active?: boolean;
          make?: string | null;
          model?: string | null;
          owner_id?: string | null;
          plate_number?: string;
          updated_at?: string;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };
      visitors: {
        Row: {
          checked_in_at: string | null;
          checked_in_by: string | null;
          checked_out_at: string | null;
          checked_out_by: string | null;
          created_at: string;
          estate_id: string;
          expected_at: string | null;
          full_name: string;
          host_id: string;
          id: string;
          phone: string | null;
          property_id: string | null;
          purpose: string | null;
          qr_code: string | null;
          status: Database["public"]["Enums"]["visitor_status"];
          updated_at: string;
          valid_until: string | null;
          vehicle_plate: string | null;
        };
        Insert: {
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          checked_out_at?: string | null;
          checked_out_by?: string | null;
          created_at?: string;
          estate_id: string;
          expected_at?: string | null;
          full_name: string;
          host_id: string;
          id?: string;
          phone?: string | null;
          property_id?: string | null;
          purpose?: string | null;
          qr_code?: string | null;
          status?: Database["public"]["Enums"]["visitor_status"];
          updated_at?: string;
          valid_until?: string | null;
          vehicle_plate?: string | null;
        };
        Update: {
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          checked_out_at?: string | null;
          checked_out_by?: string | null;
          created_at?: string;
          estate_id?: string;
          expected_at?: string | null;
          full_name?: string;
          host_id?: string;
          id?: string;
          phone?: string | null;
          property_id?: string | null;
          purpose?: string | null;
          qr_code?: string | null;
          status?: Database["public"]["Enums"]["visitor_status"];
          updated_at?: string;
          valid_until?: string | null;
          vehicle_plate?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "visitors_estate_id_fkey";
            columns: ["estate_id"];
            isOneToOne: false;
            referencedRelation: "estates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visitors_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_verified_due_payment: {
        Args: { _amount: number; _invoice_id: string; _reference: string };
        Returns: undefined;
      };
      current_estate_id: { Args: { _user_id: string }; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_estate_staff: {
        Args: { _estate_id: string; _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      announcement_priority: "info" | "important" | "emergency";
      app_role:
        | "super_admin"
        | "estate_admin"
        | "community_chairman"
        | "community_secretary"
        | "treasurer"
        | "chief_security_officer"
        | "security_officer"
        | "security_gateman"
        | "resident"
        | "household_member"
        | "domestic_staff";
      complaint_priority: "low" | "medium" | "high" | "urgent";
      complaint_status: "open" | "assigned" | "in_progress" | "resolved" | "closed";
      document_scope: "estate" | "property" | "resident";
      incident_severity: "low" | "medium" | "high" | "critical";
      incident_status: "reported" | "investigating" | "resolved" | "archived";
      invoice_status: "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled";
      member_type:
        | "spouse"
        | "child"
        | "parent"
        | "relative"
        | "driver"
        | "housekeeper"
        | "chef"
        | "gardener"
        | "security_aide"
        | "other";
      payment_method: "card" | "transfer" | "cash" | "wallet";
      payment_status: "pending" | "completed" | "failed" | "refunded";
      property_status: "occupied" | "vacant" | "under_maintenance" | "reserved";
      property_type: "detached" | "semi_detached" | "terrace" | "apartment" | "duplex" | "bungalow";
      resident_type: "landlord" | "tenant";
      visitor_status: "expected" | "checked_in" | "checked_out" | "expired" | "denied";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      announcement_priority: ["info", "important", "emergency"],
      app_role: [
        "super_admin",
        "estate_admin",
        "community_chairman",
        "community_secretary",
        "treasurer",
        "chief_security_officer",
        "security_officer",
        "security_gateman",
        "resident",
        "household_member",
        "domestic_staff",
      ],
      complaint_priority: ["low", "medium", "high", "urgent"],
      complaint_status: ["open", "assigned", "in_progress", "resolved", "closed"],
      document_scope: ["estate", "property", "resident"],
      incident_severity: ["low", "medium", "high", "critical"],
      incident_status: ["reported", "investigating", "resolved", "archived"],
      invoice_status: ["draft", "sent", "partial", "paid", "overdue", "cancelled"],
      member_type: [
        "spouse",
        "child",
        "parent",
        "relative",
        "driver",
        "housekeeper",
        "chef",
        "gardener",
        "security_aide",
        "other",
      ],
      payment_method: ["card", "transfer", "cash", "wallet"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      property_status: ["occupied", "vacant", "under_maintenance", "reserved"],
      property_type: ["detached", "semi_detached", "terrace", "apartment", "duplex", "bungalow"],
      resident_type: ["landlord", "tenant"],
      visitor_status: ["expected", "checked_in", "checked_out", "expired", "denied"],
    },
  },
} as const;
