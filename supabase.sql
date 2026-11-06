-- MEDICAL STORE ASOCIADOS - CRM VISITAS MEDICAS
-- Ejecutar una vez en Supabase > SQL Editor, con rol de administrador.
-- Arquitectura: 1 medico -> muchas visitas. La ficha del medico se reutiliza.
-- Las categorias son columnas generadas; NO se importan ni se editan directamente.

create table if not exists public.medicos (
  id uuid primary key default gen_random_uuid(),
  legacy_id integer unique,
  nombre_apellido text not null,
  cmp text,
  especialidad text,
  subespecialidad text,
  cumpleanos date,
  telefono text,
  email text,
  hospital_clinica_1 text,
  direccion_1 text,
  distrito_1 text,
  dias_atencion_1 text,
  horario_atencion_1 text,
  hospital_clinica_2 text,
  direccion_2 text,
  distrito_2 text,
  dias_atencion_2 text,
  horario_atencion_2 text,
  region text,
  potencial_prescripcion_1 text check (potencial_prescripcion_1 in ('A','B','C')),
  adopcion_marca_1 text check (adopcion_marca_1 in ('1','2','3','4')),
  categoria_1 text generated always as (
    case when potencial_prescripcion_1 is not null and adopcion_marca_1 is not null
      then potencial_prescripcion_1 || adopcion_marca_1 else null end
  ) stored,
  potencial_prescripcion_2 text check (potencial_prescripcion_2 in ('A','B','C')),
  adopcion_marca_2 text check (adopcion_marca_2 in ('1','2','3','4')),
  categoria_2 text generated always as (
    case when potencial_prescripcion_2 is not null and adopcion_marca_2 is not null
      then potencial_prescripcion_2 || adopcion_marca_2 else null end
  ) stored,
  contactos_mes text check (contactos_mes in ('1','2','3','4')),
  zona_ms text,
  representante_medico text,
  estratificacion_socioeconomica text check (estratificacion_socioeconomica in ('A','B','C','D')),
  sensibilidad_precio text check (sensibilidad_precio in ('Alta','Media','Baja')),
  gasto_bolsillo_cobertura text check (gasto_bolsillo_cobertura in ('GB','CO')),
  actitud_bioequivalencia text check (actitud_bioequivalencia in ('Creyente','Conservador','Resistente')),
  drivers text check (drivers in ('Bioequivalencia demostrada','Sensible al precio','Soporte al paciente')),
  nivel_influencia_1 text check (nivel_influencia_1 in ('Nacional','Regional','Local','Institucional')),
  cargo_1 text,
  institucion_1 text,
  nivel_influencia_2 text check (nivel_influencia_2 in ('Nacional','Regional','Local','Institucional')),
  cargo_2 text,
  institucion_2 text,
  speaker_panelista text check (speaker_panelista in ('Speaker','Panelista')),
  creado_por uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visitas (
  id uuid primary key default gen_random_uuid(),
  medico_id uuid not null references public.medicos(id) on delete restrict,
  fecha_hora timestamptz not null,
  representante_visita text not null,
  mensaje_entregado text,
  feedback_objecion text,
  compromiso text,
  plan_accion text,
  perfil_snapshot jsonb not null default '{}'::jsonb,
  registrado_por uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists medicos_cmp_idx on public.medicos(cmp);
create index if not exists medicos_updated_idx on public.medicos(updated_at desc);
create index if not exists visitas_medico_fecha_idx on public.visitas(medico_id, fecha_hora desc);

create or replace function public.crm_actualizar_fecha()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_medicos_updated_at on public.medicos;
create trigger trg_medicos_updated_at before update on public.medicos
for each row execute function public.crm_actualizar_fecha();

-- SEGURIDAD: ningun visitante anonimo puede consultar datos personales.
alter table public.medicos enable row level security;
alter table public.visitas enable row level security;

revoke all on public.medicos from anon, authenticated;
revoke all on public.visitas from anon, authenticated;
grant select, insert, update on public.medicos to authenticated;
grant select, insert on public.visitas to authenticated;

-- Personal autenticado comparte el directorio y puede actualizar las fichas.
-- IMPORTANTE: deshabilitar el registro publico y admitir usuarios solo autorizados.
drop policy if exists "crm_medicos_select" on public.medicos;
create policy "crm_medicos_select" on public.medicos for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "crm_medicos_insert" on public.medicos;
create policy "crm_medicos_insert" on public.medicos for insert to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists "crm_medicos_update" on public.medicos;
create policy "crm_medicos_update" on public.medicos for update to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

-- Las visitas son solo de lectura tras guardarse; no se permite eliminarlas
-- desde el navegador. El autor se identifica con Supabase Auth.
drop policy if exists "crm_visitas_select" on public.visitas;
create policy "crm_visitas_select" on public.visitas for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "crm_visitas_insert" on public.visitas;
create policy "crm_visitas_insert" on public.visitas for insert to authenticated
with check ((select auth.uid()) is not null and registrado_por = (select auth.uid()));

-- NOTA: estas politicas son para un equipo interno compartido. Antes de admitir
-- usuarios externos, implementar control por zona, equipo o rol.
