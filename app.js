/* Medical Store - CRM de visitas. JavaScript puro, sin servidor propio. */
(() => {
  'use strict';

  const POTENCIAL = [
    ['A', 'A · Alto volumen de pacientes'],
    ['B', 'B · Volumen moderado'],
    ['C', 'C · Bajo volumen de pacientes']
  ];
  const ADOPCION = [
    ['1', '1 · Fidelizado: prioriza nuestro producto'],
    ['2', '2 · Compartido: producto y competencia'],
    ['3', '3 · Competencia: prescribe otras marcas'],
    ['4', '4 · Resistente al cambio']
  ];
  const INFLUENCIA = ['Nacional', 'Regional', 'Local', 'Institucional'];
  const CARGOS = ['Presidente Sociedad Médica', 'Directivo Sociedad Médica', 'KOL', 'Investigador', 'Director General', 'Director médico', 'Jefe de Departamento', 'Jefe de Servicio'];
  const opts = (arr) => arr.map((x) => Array.isArray(x) ? { value: x[0], label: x[1] } : { value: x, label: x });
  const field = (name, label, type = 'text', extras = {}) => ({ name, label, type, ...extras });

  // Grupos y preguntas tomados de la hoja FRONT. El ID lo genera Supabase.
  const GROUPS = [
    { title: 'Información general', subtitle: 'Identificación y contacto', fields: [
      field('nombre_apellido', 'Nombre y apellido', 'text', { required: true, wide: true, placeholder: 'Nombre completo del médico' }),
      field('cmp', 'CMP', 'text', { placeholder: 'N.º de colegiatura', hint: 'Se conserva como texto para respetar los ceros iniciales.' }),
      field('especialidad', 'Especialidad', 'text', { placeholder: 'Ej. Endocrinología' }),
      field('subespecialidad', 'Sub-especialidad'),
      field('cumpleanos', 'Cumpleaños', 'date'),
      field('telefono', 'Teléfono', 'tel', { placeholder: 'Ej. 987654321' }),
      field('email', 'E-mail', 'email', { placeholder: 'correo@ejemplo.com', wide: true })
    ] },
    { title: 'Información laboral', subtitle: 'Centros de atención y horarios', fields: [
      field('hospital_clinica_1', 'Hospital / Clínica 1', 'text', { wide: true }),
      field('direccion_1', 'Dirección 1', 'text', { wide: true }),
      field('distrito_1', 'Distrito 1'),
      field('dias_atencion_1', 'Días atención 1', 'text', { placeholder: 'Ej. Lunes a viernes' }),
      field('horario_atencion_1', 'Horario atención 1', 'text', { placeholder: 'Ej. 08:00 a 13:00', wide: true }),
      field('hospital_clinica_2', 'Hospital / Clínica 2', 'text', { wide: true }),
      field('direccion_2', 'Dirección 2', 'text', { wide: true }),
      field('distrito_2', 'Distrito 2'),
      field('dias_atencion_2', 'Días atención 2'),
      field('horario_atencion_2', 'Horario atención 2', 'text', { wide: true }),
      field('region', 'Región', 'text', { placeholder: 'Ej. Lima, Arequipa' })
    ] },
    { title: 'Segmentación, categorización y selling time', subtitle: 'Potencial, adopción y frecuencia de contacto', fields: [
      field('potencial_prescripcion_1', 'Potencial de prescripción 1', 'select', { options: opts(POTENCIAL) }),
      field('adopcion_marca_1', 'Adopción de marca 1', 'select', { options: opts(ADOPCION) }),
      field('categoria_1', 'Categoría 1 (automática)', 'computed', { hint: 'Potencial + adopción. Ejemplo: A2.' }),
      field('potencial_prescripcion_2', 'Potencial de prescripción 2', 'select', { options: opts(POTENCIAL) }),
      field('adopcion_marca_2', 'Adopción de marca 2', 'select', { options: opts(ADOPCION) }),
      field('categoria_2', 'Categoría 2 (automática)', 'computed'),
      field('contactos_mes', 'Contactos / mes', 'select', { options: opts(['1', '2', '3', '4']) })
    ] },
    { title: 'MS Pharma', subtitle: 'Asignación de zona y representante', fields: [
      field('zona_ms', 'Zona MS', 'text', { hint: 'Catálogo de zonas pendiente de definición en la hoja original.' }),
      field('representante_medico', 'Representante Médico', 'text', { placeholder: 'Nombre del representante asignado' })
    ] },
    { title: 'Perfil de pacientes', subtitle: 'Características del grupo de pacientes atendidos', fields: [
      field('estratificacion_socioeconomica', 'Estratificación socioeconómica', 'select', { options: opts(['A', 'B', 'C', 'D']) }),
      field('sensibilidad_precio', 'Sensibilidad al precio', 'select', { options: opts(['Alta', 'Media', 'Baja']) }),
      field('gasto_bolsillo_cobertura', 'Gasto bolsillo / Cobertura', 'select', { options: opts([['GB', 'GB · Gasto de bolsillo'], ['CO', 'CO · Cobertura (EPS, seguro u otros)']]) })
    ] },
    { title: 'Toma de decisión', subtitle: 'Barreras y motivadores de prescripción', fields: [
      field('actitud_bioequivalencia', 'Actitud bioequivalencia', 'select', { options: opts([
        ['Creyente', 'Creyente · Confía en bioequivalencia'],
        ['Conservador', 'Conservador · Requiere evidencia sólida'],
        ['Resistente', 'Resistente · Prefiere innovador u otras copias']
      ]) }),
      field('drivers', 'Drivers', 'select', { options: opts([
        ['Bioequivalencia demostrada', 'Bioequivalencia demostrada · Evidencia sólida'],
        ['Sensible al precio', 'Sensible al precio · Ahorro significativo'],
        ['Soporte al paciente', 'Soporte al paciente · Programas de apoyo']
      ]) })
    ] },
    { title: 'Perfil académico y redes de influencia', subtitle: 'Rol profesional, instituciones y participación', fields: [
      field('nivel_influencia_1', 'Nivel de influencia 1', 'select', { options: opts(INFLUENCIA) }),
      field('cargo_1', 'Cargo 1', 'select', { options: opts(CARGOS) }),
      field('institucion_1', 'Institución 1', 'text', { wide: true }),
      field('nivel_influencia_2', 'Nivel de influencia 2', 'select', { options: opts(INFLUENCIA) }),
      field('cargo_2', 'Cargo 2', 'select', { options: opts(CARGOS) }),
      field('institucion_2', 'Institución 2', 'text', { wide: true }),
      field('speaker_panelista', 'Speaker / Panelista', 'select', { options: opts(['Speaker', 'Panelista']) })
    ] }
  ];
  const VISIT_FIELDS = [
    field('fecha_hora', 'Fecha y hora', 'datetime-local', { required: true }),
    field('representante_visita', 'Representante que realiza la visita', 'text', { placeholder: 'Nombre del visitador', required: true }),
    field('mensaje_entregado', 'Mensaje entregado', 'textarea', { wide: true, placeholder: 'Información sobre los productos comunicada al médico...' }),
    field('feedback_objecion', 'Feedback / Objeción', 'textarea', { wide: true, placeholder: 'Reacción, comentarios y objeciones del médico...' }),
    field('compromiso', 'Compromiso', 'textarea', { wide: true, placeholder: 'Acuerdo o próximo paso comprometido...' }),
    field('plan_accion', 'Plan de acción', 'textarea', { wide: true, placeholder: 'Acciones para impulsar la adopción, incluyendo micromarketing...' })
  ];
  const PROFILE_KEYS = GROUPS.flatMap((g) => g.fields.filter((f) => f.type !== 'computed').map((f) => f.name));
  const CONFIG = window.CRM_CONFIG || {};
  const configured = /^https:\/\/[^\s]+\.supabase\.co\/?$/.test(CONFIG.SUPABASE_URL || '') &&
    !!CONFIG.SUPABASE_PUBLISHABLE_KEY && !CONFIG.SUPABASE_PUBLISHABLE_KEY.startsWith('TU_');
  const demo = !configured;
  const db = configured && window.supabase ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY) : null;
  let user = null;
  let current = null;
  let searchTimer = null;
  let searchToken = 0;
  let busy = false;
  let currentTab = 'profile';
  let demoDoctors = [
    { id: 'demo-1', nombre_apellido: 'Dra. Ana Ejemplo', cmp: '000001', especialidad: 'Endocrinología', hospital_clinica_1: 'Centro Médico de Demostración', region: 'Lima', zona_ms: 'Zona Demo', representante_medico: 'Representante Demo', potencial_prescripcion_1: 'A', adopcion_marca_1: '2', categoria_1: 'A2', updated_at: new Date().toISOString() },
    { id: 'demo-2', nombre_apellido: 'Dr. Luis Demostración', cmp: '000002', especialidad: 'Medicina Interna', hospital_clinica_1: 'Clínica de Ejemplo', region: 'Arequipa', updated_at: new Date().toISOString() }
  ];
  let demoVisits = [];
  const $ = (id) => document.getElementById(id);
  const esc = (text) => String(text ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const fmt = (v) => v ? new Date(v).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha';
  const initials = (name) => String(name || 'NM').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const nowLocal = () => { const d = new Date(); const off = d.getTimezoneOffset(); return new Date(d.getTime() - off * 60000).toISOString().slice(0,16); };

  function notify(message, error = false) {
    const toast = $('toast');
    toast.textContent = message;
    toast.className = `toast visible${error ? ' error' : ''}`;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { toast.classList.remove('visible'); }, 4200);
  }
  function showLogin() { $('login-screen').hidden = false; $('app').hidden = true; }
  function showApp() {
    $('login-screen').hidden = true; $('app').hidden = false;
    $('demo-banner').hidden = !demo;
    $('mode-pill').hidden = !demo;
    $('logout-button').hidden = demo;
    $('user-label').hidden = demo;
    if (user) $('user-label').textContent = user.email || '';
    refreshDoctors('');
  }
  function lock(on, target) {
    busy = on;
    if (!target) return;
    target.disabled = on;
    if (on) {
      target.dataset.restoreHtml = target.innerHTML;
      target.textContent = 'Guardando…';
    } else {
      target.innerHTML = target.dataset.restoreHtml || target.innerHTML;
      delete target.dataset.restoreHtml;
    }
  }
  function getValues(form, fields) {
    const payload = {};
    for (const name of fields) {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) continue;
      const raw = input.value.trim();
      payload[name] = raw || null;
    }
    return payload;
  }
  function renderField(f, prefix) {
    const inputId = `${prefix}-${f.name}`;
    const req = f.required ? ' required' : '';
    const placeholder = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : '';
    let control;
    if (f.type === 'select') {
      control = `<select id="${inputId}" name="${f.name}"${req}><option value="">Seleccionar opción</option>${f.options.map((opt) => `<option value="${esc(opt.value)}">${esc(opt.label)}</option>`).join('')}</select>`;
    } else if (f.type === 'computed') {
      control = `<input id="${inputId}" type="text" readonly tabindex="-1" placeholder="Se calcula automáticamente" />`;
    } else if (f.type === 'textarea') {
      control = `<textarea id="${inputId}" name="${f.name}" rows="3"${placeholder}></textarea>`;
    } else {
      control = `<input id="${inputId}" name="${f.name}" type="${f.type}"${placeholder}${req}${f.type === 'tel' ? ' inputmode="tel"' : ''} />`;
    }
    return `<div class="field${f.wide ? ' full-span' : ''}"><label for="${inputId}">${esc(f.label)}${f.required ? ' <span class="required">*</span>' : ''}</label>${control}${f.hint ? `<span class="hint">${esc(f.hint)}</span>` : ''}</div>`;
  }
  function buildForm() {
    $('profile-groups').innerHTML = GROUPS.map((g, i) => `
      <details class="profile-group" ${i === 0 ? 'open' : ''}>
        <summary><span class="group-number">${String(i+1).padStart(2,'0')}</span><span class="group-title"><strong>${esc(g.title)}</strong><small>${esc(g.subtitle)}</small></span><span class="chevron"></span></summary>
        <div class="fields-grid">${g.fields.map((f) => renderField(f, 'p')).join('')}</div>
      </details>`).join('');
    $('visit-fields').innerHTML = VISIT_FIELDS.map((f) => renderField(f, 'v')).join('');
    ['potencial_prescripcion_1', 'adopcion_marca_1', 'potencial_prescripcion_2', 'adopcion_marca_2'].forEach((key) => {
      $('profile-form').querySelector(`[name="${key}"]`).addEventListener('change', updateCategories);
    });
    $('v-fecha_hora').value = nowLocal();
  }
  function updateCategories() {
    for (const n of ['1','2']) {
      const a = $(`p-potencial_prescripcion_${n}`).value;
      const b = $(`p-adopcion_marca_${n}`).value;
      $(`p-categoria_${n}`).value = a && b ? `${a}${b}` : '';
    }
  }
  function setProfileValues(record = {}) {
    for (const key of PROFILE_KEYS) {
      const element = $('profile-form').elements.namedItem(key);
      if (element) element.value = record[key] ?? '';
    }
    updateCategories();
  }
  function setVisitDefaults() {
    $('visit-form').reset();
    $('v-fecha_hora').value = nowLocal();
    $('v-representante_visita').value = current?.representante_medico || '';
  }
  function updateSummary() {
    const newDoctor = !current?.id;
    $('doctor-name').textContent = newDoctor ? 'Nuevo médico' : (current.nombre_apellido || 'Sin nombre');
    $('doctor-avatar').textContent = initials(newDoctor ? 'NM' : current.nombre_apellido);
    $('doctor-status').textContent = newDoctor ? 'NUEVA FICHA' : 'FICHA GUARDADA';
    $('doctor-status').classList.toggle('new', newDoctor);
    $('doctor-meta').textContent = newDoctor ? 'Completa los datos para crear la ficha.' :
      [current.cmp ? `CMP ${current.cmp}` : null, current.especialidad, current.hospital_clinica_1].filter(Boolean).join('  ·  ') || 'Perfil médico';
    $('profile-title').textContent = newDoctor ? 'Crear ficha médica' : 'Actualizar ficha médica';
    $('profile-description').textContent = newDoctor ? 'Completa los campos disponibles. El resto se puede añadir después.' : 'Los datos de la ficha se reutilizan en cada visita. Puedes actualizarlos cuando cambien.';
    $('save-profile').innerHTML = newDoctor ? 'Guardar ficha y continuar <span>→</span>' : 'Guardar cambios y continuar <span>→</span>';
    $('tab-visit').disabled = newDoctor;
    $('tab-history').disabled = newDoctor;
  }
  function setTab(tab) {
    if (!current?.id && tab !== 'profile') { notify('Guarda la ficha del nuevo médico antes de continuar.'); return; }
    currentTab = tab;
    for (const name of ['profile','visit','history']) {
      $(`panel-${name}`).hidden = name !== tab;
      const item = $(`tab-${name}`);
      item.classList.toggle('active', name === tab);
      item.setAttribute('aria-selected', String(name === tab));
    }
    if (tab === 'history') loadHistory();
    if (window.matchMedia('(max-width: 720px)').matches) {
      $('active-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function openDoctor(record, tab = 'visit') {
    current = record ? { ...record } : null;
    $('selection-placeholder').hidden = true;
    $('active-workspace').hidden = false;
    setProfileValues(record || {});
    setVisitDefaults();
    updateSummary();
    setTab(record?.id ? tab : 'profile');
    for (const item of document.querySelectorAll('.doctor-item')) item.classList.toggle('active', item.dataset.id === current?.id);
  }
  function closeDoctor() {
    current = null;
    $('selection-placeholder').hidden = false;
    $('active-workspace').hidden = true;
  }
  function displayDoctors(items) {
    $('result-count').textContent = String(items.length);
    $('doctor-results').innerHTML = items.length ? items.map((d) => `
      <button class="doctor-item${d.id === current?.id ? ' active' : ''}" type="button" data-id="${esc(d.id)}">
        <span class="mini-avatar">${esc(initials(d.nombre_apellido))}</span>
        <span class="doctor-item-content"><strong>${esc(d.nombre_apellido)}</strong><small>${esc([d.cmp ? `CMP ${d.cmp}` : null, d.especialidad].filter(Boolean).join(' · ') || 'Información por completar')}</small></span>
      </button>`).join('') : `<div class="empty-search">No encontramos médicos.<br/>Puedes registrar uno nuevo.</div>`;
    const byId = new Map(items.map((d) => [String(d.id), d]));
    $('doctor-results').querySelectorAll('.doctor-item').forEach((btn) => btn.addEventListener('click', async () => {
      if (busy) return;
      const clicked = byId.get(btn.dataset.id);
      if (!clicked) return;
      if (demo) { openDoctor(clicked); return; }
      try {
        const { data, error } = await db.from('medicos').select('*').eq('id', clicked.id).single();
        if (error) throw error;
        openDoctor(data);
      } catch (err) { notify(`No se pudo abrir el médico: ${err.message}`, true); }
    }));
  }
  async function refreshDoctors(term = '') {
    const token = ++searchToken;
    const q = String(term).trim().slice(0,100);
    $('doctor-results').innerHTML = '<div class="loading-placeholder">Buscando médicos…</div>';
    try {
      let rows;
      if (demo) {
        rows = demoDoctors.filter((d) => !q || [d.nombre_apellido, d.cmp].join(' ').toLocaleLowerCase('es-PE').includes(q.toLocaleLowerCase('es-PE'))).slice(0,25);
      } else {
        // Consultas separadas: evita construir manualmente expresiones PostgREST "or" a partir de texto del usuario.
        const clean = q.replace(/[%_]/g, '');
        const base = 'id,nombre_apellido,cmp,especialidad,hospital_clinica_1';
        if (!clean) {
          const response = await db.from('medicos').select(base).order('updated_at', { ascending: false }).limit(25);
          if (response.error) throw response.error;
          rows = response.data;
        } else {
          const [named, cmp] = await Promise.all([
            db.from('medicos').select(base).ilike('nombre_apellido', `%${clean}%`).limit(20),
            db.from('medicos').select(base).ilike('cmp', `%${clean}%`).limit(20)
          ]);
          if (named.error) throw named.error;
          if (cmp.error) throw cmp.error;
          rows = [...new Map([...named.data, ...cmp.data].map((d) => [d.id, d])).values()].slice(0,25);
        }
      }
      if (token !== searchToken) return;
      displayDoctors(rows);
      $('directory-status').textContent = q ? 'Resultados de búsqueda' : 'Médicos recientes · escribe para buscar';
    } catch (err) {
      if (token !== searchToken) return;
      $('doctor-results').innerHTML = `<div class="empty-search">No se pudieron cargar los médicos.<br/>Comprueba la conexión.</div>`;
      notify(err.message || 'Error de conexión', true);
    }
  }
  async function saveProfile(event) {
    event.preventDefault();
    if (busy) return;
    const form = $('profile-form');
    const payload = getValues(form, PROFILE_KEYS);
    if (!payload.nombre_apellido) { notify('El nombre y apellido del médico es obligatorio.', true); $('p-nombre_apellido').focus(); $('profile-groups').firstElementChild.open = true; return; }
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) { notify('Revisa el correo electrónico.', true); $('p-email').focus(); return; }
    const target = $('save-profile');
    lock(true, target);
    try {
      if (!current?.id && payload.cmp && /^\d{5,8}$/.test(payload.cmp)) {
        const found = demo ? demoDoctors.find((d) => d.cmp === payload.cmp) : (await db.from('medicos').select('id,nombre_apellido').eq('cmp', payload.cmp).limit(1)).data?.[0];
        if (found) throw new Error(`Ya existe un médico con CMP ${payload.cmp}. Búscalo en el directorio antes de crear otra ficha.`);
      }
      let saved;
      if (demo) {
        saved = { ...current, ...payload, id: current?.id || `demo-${Date.now()}`, updated_at: new Date().toISOString(), categoria_1: $('p-categoria_1').value || null, categoria_2: $('p-categoria_2').value || null };
        const ix = demoDoctors.findIndex((d) => d.id === saved.id);
        if (ix >= 0) demoDoctors[ix] = saved; else demoDoctors.unshift(saved);
      } else {
        const request = current?.id ? db.from('medicos').update(payload).eq('id', current.id) : db.from('medicos').insert(payload);
        const { data, error } = await request.select('*').single();
        if (error) throw error;
        saved = data;
      }
      current = saved;
      updateSummary();
      setVisitDefaults();
      notify('Ficha médica guardada correctamente.');
      await refreshDoctors($('doctor-search').value);
      setTab('visit');
    } catch (err) { notify(`No se guardó la ficha: ${err.message}`, true); }
    finally { lock(false, target); updateSummary(); }
  }
  async function saveVisit(event) {
    event.preventDefault();
    if (busy || !current?.id) return;
    const form = $('visit-form');
    const payload = getValues(form, VISIT_FIELDS.map((f) => f.name));
    if (!payload.fecha_hora) { notify('Indica fecha y hora de la visita.', true); $('v-fecha_hora').focus(); return; }
    if (!payload.representante_visita) { notify('Indica quién realizó la visita.', true); $('v-representante_visita').focus(); return; }
    if (!['mensaje_entregado','feedback_objecion','compromiso','plan_accion'].some((key) => payload[key])) {
      notify('Completa al menos un dato de la visita (mensaje, feedback, compromiso o plan).', true);
      $('v-mensaje_entregado').focus(); return;
    }
    const parsed = new Date(payload.fecha_hora);
    if (Number.isNaN(parsed.getTime())) { notify('La fecha y hora no es válida.', true); return; }
    payload.fecha_hora = parsed.toISOString();
    payload.medico_id = current.id;
    // Este snapshot conserva cómo estaba categorizado el médico en el momento de cada visita.
    // Copia de los bloques comerciales que pueden evolucionar entre visitas.
    // Los datos de contacto personales se mantienen solamente en la ficha.
    const keysSnapshot = GROUPS.slice(2).flatMap((g) => g.fields.map((f) => f.name));
    payload.perfil_snapshot = Object.fromEntries(keysSnapshot.map((key) => [key, current[key] ?? null]));
    const target = $('save-visit');
    lock(true, target);
    try {
      if (demo) {
        demoVisits.unshift({ ...payload, id: `vis-${Date.now()}`, registrado_por: 'demo', created_at: new Date().toISOString() });
      } else {
        payload.registrado_por = user.id;
        const { error } = await db.from('visitas').insert(payload);
        if (error) throw error;
      }
      setVisitDefaults();
      notify('Visita registrada correctamente. Puedes registrar otra visita cuando quieras.');
      setTab('history');
    } catch (err) { notify(`No se guardó la visita: ${err.message}`, true); }
    finally { lock(false, target); }
  }
  async function loadHistory() {
    if (!current?.id) return;
    const selectedId = current.id;
    $('history-list').innerHTML = '<div class="loading-placeholder">Cargando historial…</div>';
    try {
      let visits;
      if (demo) {
        visits = demoVisits.filter((v) => v.medico_id === selectedId).sort((a,b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
      } else {
        const { data, error } = await db.from('visitas').select('*').eq('medico_id', selectedId).order('fecha_hora', { ascending: false }).limit(100);
        if (error) throw error;
        visits = data;
      }
      if (current?.id !== selectedId) return;
      if (!visits.length) {
        $('history-list').innerHTML = '<div class="no-history">Todavía no hay visitas registradas para este médico.<br/>La primera quedará aquí con sus acuerdos y observaciones.</div>';
        return;
      }
      const labels = [
        ['mensaje_entregado','Mensaje entregado'],
        ['feedback_objecion','Feedback / Objeción'],
        ['compromiso','Compromiso'],
        ['plan_accion','Plan de acción']
      ];
      $('history-list').innerHTML = visits.map((visit, index) => `<details class="history-card">
        <summary><span class="history-index">${String(index+1).padStart(2,'0')}</span><span class="history-copy"><span class="history-date">${esc(fmt(visit.fecha_hora))}</span><span class="history-subtitle">${esc(visit.representante_visita || 'Representante sin especificar')}${visit.perfil_snapshot?.categoria_1 ? ` · Categoría ${esc(visit.perfil_snapshot.categoria_1)}` : ''}</span></span><span class="chevron"></span></summary>
        <div class="history-detail">${labels.map(([key,label]) => `<p><strong>${label}</strong>${esc(visit[key] || 'Sin información registrada')}</p>`).join('')}</div>
      </details>`).join('');
    } catch (err) { $('history-list').innerHTML = '<div class="no-history">No fue posible cargar el historial.</div>'; notify(err.message, true); }
  }
  function startEvents() {
    $('doctor-search').addEventListener('input', (event) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => refreshDoctors(event.target.value), 230);
    });
    [$('new-doctor'), $('placeholder-new')].forEach((btn) => btn.addEventListener('click', () => {
      if (busy) return;
      openDoctor(null);
    }));
    $('switch-doctor').addEventListener('click', () => { closeDoctor(); $('doctor-search').focus(); });
    ['profile','visit','history'].forEach((key) => $(`tab-${key}`).addEventListener('click', () => setTab(key)));
    $('profile-form').addEventListener('submit', saveProfile);
    $('visit-form').addEventListener('submit', saveVisit);
    $('history-new').addEventListener('click', () => { setVisitDefaults(); setTab('visit'); });
    $('logout-button').addEventListener('click', async () => {
      if (db) { const { error } = await db.auth.signOut(); if (error) { notify(error.message, true); return; } }
      user = null; current = null; closeDoctor(); showLogin();
    });
    $('login-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!db) return;
      $('login-error').hidden = true;
      const button = $('login-button');
      button.disabled = true;
      try {
        const { data, error } = await db.auth.signInWithPassword({ email: $('login-email').value.trim(), password: $('login-password').value });
        if (error) throw error;
        user = data.user;
        $('login-password').value = '';
        showApp();
      } catch (err) { $('login-error').textContent = err.message || 'No fue posible iniciar sesión'; $('login-error').hidden = false; }
      finally { button.disabled = false; }
    });
  }
  async function init() {
    buildForm(); startEvents();
    if (demo) { showApp(); return; }
    if (!db) {
      showLogin();
      $('login-error').textContent = 'No se pudo cargar la biblioteca de Supabase. Revisa tu conexión a internet.';
      $('login-error').hidden = false;
      return;
    }
    try {
      const { data, error } = await db.auth.getUser();
      if (error && !['Auth session missing!'].includes(error.message)) console.warn(error.message);
      user = data?.user || null;
      if (user) showApp(); else showLogin();
    } catch (err) { showLogin(); notify('No se pudo comprobar la sesión.', true); }
    db.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { user = null; current = null; closeDoctor(); showLogin(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
