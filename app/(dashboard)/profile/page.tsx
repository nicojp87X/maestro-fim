"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "",
  });

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name ?? "",
          date_of_birth: data.date_of_birth ?? "",
          gender: data.gender ?? "",
          height_cm: data.height_cm?.toString() ?? "",
          weight_kg: data.weight_kg?.toString() ?? "",
          activity_level: data.activity_level ?? "",
        });
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: profile.full_name || null,
      date_of_birth: profile.date_of_birth || null,
      gender: profile.gender || null,
      height_cm: profile.height_cm ? parseFloat(profile.height_cm) : null,
      weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : null,
      activity_level: profile.activity_level || null,
      updated_at: new Date().toISOString(),
    });

    setLoading(false);
    if (error) {
      toast.error("Error al guardar el perfil");
    } else {
      toast.success("Perfil actualizado correctamente");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <p className="text-muted-foreground text-sm">
        Esta información se usa para personalizar tus informes FIM.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, full_name: e.target.value }))
                }
                placeholder="Tu nombre"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date_of_birth">Fecha de nacimiento</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={profile.date_of_birth}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, date_of_birth: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">Sexo biológico</Label>
              <select
                id="gender"
                value={profile.gender}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, gender: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Seleccionar...</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
                <option value="prefer_not_to_say">Prefiero no decir</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="activity_level">Nivel de actividad</Label>
              <select
                id="activity_level"
                value={profile.activity_level}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, activity_level: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Seleccionar...</option>
                <option value="sedentary">Sedentario</option>
                <option value="light">Ligeramente activo</option>
                <option value="moderate">Moderadamente activo</option>
                <option value="active">Activo</option>
                <option value="very_active">Muy activo</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="height_cm">Altura (cm)</Label>
              <Input
                id="height_cm"
                type="number"
                value={profile.height_cm}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, height_cm: e.target.value }))
                }
                placeholder="170"
                min={100}
                max={250}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="weight_kg">Peso (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                value={profile.weight_kg}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, weight_kg: e.target.value }))
                }
                placeholder="70"
                min={30}
                max={300}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
