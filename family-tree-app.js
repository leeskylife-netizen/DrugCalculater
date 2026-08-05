// Source for family-tree.bundle.js / family-tree.css. This file itself is not
// loaded by the browser — family-tree.html loads the pre-built bundle so the
// page has no CDN dependency and works offline. After editing this file,
// rebuild both artifacts:
//   npm install --no-save react@18.3.1 react-dom@18.3.1 lucide-react@0.454.0 esbuild@0.28.1 tailwindcss@3.4.13
//   npx esbuild family-tree-app.js --bundle --minify --format=iife --define:process.env.NODE_ENV='"production"' --loader:.js=jsx --outfile=family-tree.bundle.js
//   npx tailwindcss -i <(echo '@tailwind base;@tailwind components;@tailwind utilities;') -o family-tree.css --minify --content family-tree-app.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Users, Heart, ZoomIn, ZoomOut, Maximize, Plus, Edit2,
  Trash2, X, Search, Navigation, ChevronDown, ChevronUp,
  Download, Upload, Route, Moon, Sun, UserPlus, Image as ImageIcon,
  Table, Printer, Share2, Loader2, Activity, CalendarClock, BookOpen,
  Network, Briefcase, GraduationCap, Building, HeartHandshake, Map
} from 'lucide-react';

// --- 1. ข้อมูลจำลองตั้งต้น (Master Data) ---
const initialData = [
  // รุ่นที่ 1
  { id: 'P1', firstName: 'ปู่ประเสริฐ', lastName: 'รักดี', gender: 'M', birthDate: '1940', status: 'deceased', nodeType: 'person', isIndexPatient: false, diseases: 'เบาหวาน, ความดัน', fatherId: null, motherId: null, spouseId: 'P2', spouseRel: 'normal', timeline: [] },
  { id: 'P2', firstName: 'ย่ามาลัย', lastName: 'รักดี', gender: 'F', birthDate: '1945', status: 'alive', nodeType: 'person', isIndexPatient: false, diseases: '', fatherId: null, motherId: null, spouseId: 'P1', spouseRel: 'normal', timeline: [] },
  // รุ่นที่ 2 (มีหย่าร้าง)
  { id: 'P3', firstName: 'พ่อสมชาย', lastName: 'รักดี', gender: 'M', birthDate: '1970', status: 'alive', nodeType: 'person', isIndexPatient: false, diseases: 'ภูมิแพ้', fatherId: 'P1', motherId: 'P2', spouseId: 'P4', spouseRel: 'divorced', timeline: [{year: '2545', event: 'เริ่มมีอาการหลงลืม'}] },
  { id: 'P4', firstName: 'แม่สมศรี', lastName: 'ใจเย็น', gender: 'F', birthDate: '1972', status: 'alive', nodeType: 'person', isIndexPatient: true, diseases: 'เนื้องอก, เบาหวาน', fatherId: null, motherId: null, spouseId: 'P3', spouseRel: 'divorced', timeline: [{year: '2540', event: 'ผ่าตัดเนื้องอก'}, {year: '2550', event: 'ตรวจพบเบาหวาน'}] },
  { id: 'P5', firstName: 'อาสมเกียรติ', lastName: 'รักดี', gender: 'M', birthDate: '1975', status: 'alive', nodeType: 'person', isIndexPatient: false, diseases: '', fatherId: 'P1', motherId: 'P2', spouseId: 'P6', spouseRel: 'close', timeline: [] },
  { id: 'P6', firstName: 'อานุช', lastName: 'งามตา', gender: 'F', birthDate: '1978', status: 'alive', nodeType: 'person', isIndexPatient: false, diseases: '', fatherId: null, motherId: null, spouseId: 'P5', spouseRel: 'close', timeline: [] },
  // รุ่นที่ 3 (แฝด, ตั้งครรภ์, บุตรบุญธรรม)
  { id: 'P7', firstName: 'พี่เอก', lastName: 'รักดี', gender: 'M', birthDate: '1995', status: 'alive', nodeType: 'person', twinType: 'none', isIndexPatient: false, diseases: '', fatherId: 'P3', motherId: 'P4', spouseId: null, spouseRel: 'normal', timeline: [{year: '2560', event: 'เรียนจบ ป.ตรี'}] },
  { id: 'P8', firstName: 'น้องแอน', lastName: 'รักดี', gender: 'F', birthDate: '2012', status: 'alive', nodeType: 'person', relationType: 'adopted', twinType: 'none', isIndexPatient: false, diseases: '', fatherId: 'P3', motherId: 'P4', spouseId: null, spouseRel: 'normal', timeline: [{year: '2555', event: 'รับเป็นบุตรบุญธรรม'}] },
  { id: 'P10', firstName: 'ลูกในครรภ์', lastName: '', gender: 'U', birthDate: '2024', status: 'alive', nodeType: 'pregnant', twinType: 'none', isIndexPatient: false, diseases: '', fatherId: 'P3', motherId: 'P4', spouseId: null, spouseRel: 'normal', timeline: [] },
  { id: 'P11', firstName: 'แท้งบุตร', lastName: '', gender: 'U', birthDate: '2000', status: 'deceased', nodeType: 'miscarriage_spont', twinType: 'none', isIndexPatient: false, diseases: '', fatherId: 'P3', motherId: 'P4', spouseId: null, spouseRel: 'normal', timeline: [] },
  // ฝาแฝด
  { id: 'P9', firstName: 'แฝดพี่บอย', lastName: 'รักดี', gender: 'M', birthDate: '2005', status: 'alive', nodeType: 'person', twinType: 'identical', isIndexPatient: false, diseases: '', fatherId: 'P5', motherId: 'P6', spouseId: null, spouseRel: 'normal', timeline: [{year: '2551', event: 'หนีออกจากบ้าน'}] },
  { id: 'P12', firstName: 'แฝดน้องบาส', lastName: 'รักดี', gender: 'M', birthDate: '2005', status: 'alive', nodeType: 'person', twinType: 'identical', isIndexPatient: false, diseases: '', fatherId: 'P5', motherId: 'P6', spouseId: null, spouseRel: 'normal', timeline: [{year: '2551', event: 'หนีออกจากบ้าน'}] },
];

const initialEcoNodes = [
  { id: 'E1', name: 'โรงพยาบาล', type: 'health', relation: 'strong' },
  { id: 'E2', name: 'ที่ทำงาน', type: 'work', relation: 'conflict' },
  { id: 'E3', name: 'เพื่อนบ้าน', type: 'social', relation: 'distant' },
  { id: 'E4', name: 'วัด / ศาสนา', type: 'religion', relation: 'strong' },
];

const getAvatarEmoji = (gender, birthDate, nodeType) => {
  if (nodeType !== 'person') return '';
  const year = parseInt(birthDate);
  if (!year || isNaN(year)) return gender === 'F' ? '👩🏻' : (gender === 'M' ? '👨🏻' : '👤');
  if (gender === 'M') return (year <= 1955 || year <= 2500) ? '👴🏼' : (year >= 2005 || year >= 2548) ? '👦🏻' : '👨🏻';
  if (gender === 'F') return (year <= 1955 || year <= 2500) ? '👵🏼' : (year >= 2005 || year >= 2548) ? '👧🏻' : '👩🏻';
  return '👤';
};

function App() {
  // --- 2. State Management ---
  const [data, setData] = useState([]);
  const [ecoNodes, setEcoNodes] = useState([]);
  const [rootId, setRootId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('genogram');

  // Interactions
  const [pathFinder, setPathFinder] = useState({ active: false, nodeA: null, nodeB: null, path: [] });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEcoFormOpen, setIsEcoFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [editingEcoNode, setEditingEcoNode] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [formData, setFormData] = useState({
    id: '', firstName: '', lastName: '', gender: 'M', birthDate: '',
    status: 'alive', nodeType: 'person', relationType: 'biological', twinType: 'none', isIndexPatient: false, diseases: '',
    fatherId: '', motherId: '', spouseId: '', spouseRel: 'normal', timeline: []
  });

  const [ecoFormData, setEcoFormData] = useState({ id: '', name: '', type: 'social', relation: 'strong' });

  // Exports
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const fileInputRef = useRef(null);
  const treeContainerRef = useRef(null);

  // --- 3. Effects ---
  useEffect(() => {
    const savedData = localStorage.getItem('masterpieceFamilyTree');
    const savedEcoData = localStorage.getItem('masterpieceEcoMap');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setData(parsedData);
      if (parsedData.length > 0) setRootId(parsedData[0].id);
    } else {
      setData(initialData); setRootId(initialData[0].id);
    }
    if (savedEcoData) setEcoNodes(JSON.parse(savedEcoData));
    else setEcoNodes(initialEcoNodes);
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem('masterpieceFamilyTree', JSON.stringify(data));
      if (!data.find(p => p.id === rootId)) setRootId(data[0].id);
    }
    localStorage.setItem('masterpieceEcoMap', JSON.stringify(ecoNodes));
  }, [data, rootId, ecoNodes]);

  useEffect(() => {
    if (pathFinder.nodeA && pathFinder.nodeB) {
      const graph = {};
      data.forEach(p => graph[p.id] = new Set());
      data.forEach(p => {
        if (p.fatherId) { graph[p.id].add(p.fatherId); graph[p.fatherId].add(p.id); }
        if (p.motherId) { graph[p.id].add(p.motherId); graph[p.motherId].add(p.id); }
        if (p.spouseId) { graph[p.id].add(p.spouseId); graph[p.spouseId].add(p.id); }
      });
      const queue = [[pathFinder.nodeA]];
      const visited = new Set([pathFinder.nodeA]);
      let foundPath = [];
      while (queue.length > 0) {
        const path = queue.shift();
        const currentId = path[path.length - 1];
        if (currentId === pathFinder.nodeB) { foundPath = path; break; }
        for (let neighbor of graph[currentId] || []) {
          if (!visited.has(neighbor)) { visited.add(neighbor); queue.push([...path, neighbor]); }
        }
      }
      setPathFinder(prev => ({ ...prev, path: foundPath }));
    } else {
      setPathFinder(prev => ({ ...prev, path: [] }));
    }
  }, [pathFinder.nodeA, pathFinder.nodeB, data]);

  // --- 4. Handlers ---
  const handleCardClick = (person) => {
    if (pathFinder.active) {
      if (!pathFinder.nodeA) setPathFinder(prev => ({ ...prev, nodeA: person.id }));
      else if (!pathFinder.nodeB && person.id !== pathFinder.nodeA) setPathFinder(prev => ({ ...prev, nodeB: person.id }));
      else setPathFinder(prev => ({ ...prev, nodeA: person.id, nodeB: null, path: [] }));
    } else {
      setSelectedProfile(person); setIsProfileOpen(true);
    }
  };

  const openAddModal = (parentId = null, role = null) => {
    setEditingPerson(null);
    setFormData({
      id: 'P' + Date.now(), firstName: '', lastName: '', gender: 'M', birthDate: '',
      status: 'alive', nodeType: 'person', relationType: 'biological', twinType: 'none', isIndexPatient: false, diseases: '', spouseRel: 'normal', timeline: [],
      fatherId: role === 'father' ? parentId : '', motherId: role === 'mother' ? parentId : '', spouseId: role === 'spouse' ? parentId : ''
    });
    setIsFormOpen(true);
  };

  const openEditModal = (person) => {
    setEditingPerson(person.id);
    setFormData({
      ...person, timeline: person.timeline || [], diseases: person.diseases || '',
      nodeType: person.nodeType || 'person', twinType: person.twinType || 'none', gender: person.gender || 'U'
    });
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    let newPerson = { ...formData, fatherId: formData.fatherId || null, motherId: formData.motherId || null, spouseId: formData.spouseId || null };
    let updatedData = [...data];
    if (newPerson.isIndexPatient) updatedData = updatedData.map(p => ({...p, isIndexPatient: false}));
    if (editingPerson) updatedData = updatedData.map(p => p.id === editingPerson ? newPerson : p);
    else updatedData.push(newPerson);

    if (newPerson.spouseId) {
      updatedData = updatedData.map(p => {
        if (p.id === newPerson.spouseId) return { ...p, spouseId: newPerson.id, spouseRel: newPerson.spouseRel };
        if (p.spouseId === newPerson.id && p.id !== newPerson.spouseId) return { ...p, spouseId: null };
        return p;
      });
    }
    setData(updatedData); setIsFormOpen(false);
    if(isProfileOpen) setSelectedProfile(newPerson);
  };

  const handleDelete = (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบุคคลนี้?')) {
      setData(data.filter(p => p.id !== id).map(p => {
        const newP = { ...p };
        if (newP.fatherId === id) newP.fatherId = null;
        if (newP.motherId === id) newP.motherId = null;
        if (newP.spouseId === id) newP.spouseId = null;
        return newP;
      }));
      setIsProfileOpen(false);
    }
  };

  // Canvas Control
  const handleMouseDown = (e) => { if (e.target.closest('.no-drag')) return; setIsDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); };
  const handleMouseMove = (e) => { if (!isDragging) return; setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };

  // --- 5. Export Systems (Full Set) ---
  const handleExportJSON = () => {
    const a = document.createElement('a');
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({family: data, ecomap: ecoNodes}, null, 2));
    a.download = "masterpiece_backup.json"; a.click(); setIsExportMenuOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'ชื่อ', 'นามสกุล', 'เพศ', 'ปีเกิด', 'สถานะ', 'โรคประจำตัว', 'ประเภทโหนด', 'ประเภทบุตร', 'แฝด', 'ID บิดา', 'ID มารดา', 'ID คู่สมรส'];
    const csvRows = [headers.join(',')];
    data.forEach(p => csvRows.push([p.id, p.firstName, p.lastName, p.gender, p.birthDate||'-', p.status==='alive'?'มีชีวิต':'เสียชีวิต', `"${p.diseases||'-'}"`, p.nodeType, p.relationType==='adopted'?'บุตรบุญธรรม':'สายเลือดแท้', p.twinType, p.fatherId||'-', p.motherId||'-', p.spouseId||'-'].join(',')));
    const csvData = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(csvData); a.download = "family_data.csv"; a.click(); setIsExportMenuOpen(false);
  };

  const handleExportImage = async () => {
    setIsExportingImage(true); setIsExportMenuOpen(false);
    try {
      const html2canvas = (await import('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.esm.js')).default;
      const element = treeContainerRef.current;
      if (element) {
        const originalTransform = element.style.transform;
        element.style.transform = 'scale(1) translate(0px, 0px)';
        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(element, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', scale: 2 });
        element.style.transform = originalTransform;
        const a = document.createElement('a'); a.href = canvas.toDataURL("image/png"); a.download = "family_tree.png"; a.click();
      }
    } catch (err) { alert('เบราว์เซอร์ไม่รองรับการจับภาพ โปรดใช้ PDF แทนครับ'); }
    setIsExportingImage(false);
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData.family && Array.isArray(importedData.family)) {
          setData(importedData.family); setRootId(importedData.family[0]?.id);
          if(importedData.ecomap) setEcoNodes(importedData.ecomap);
        } else if (Array.isArray(importedData)) {
          setData(importedData); setRootId(importedData[0]?.id);
        }
      } catch (err) { alert("ไฟล์ JSON ไม่ถูกต้อง"); }
    };
    reader.readAsText(file); setIsExportMenuOpen(false);
  };

  // --- 6. Tree Building Algorithm ---
  const buildTree = (personId, visited = new Set()) => {
    if (visited.has(personId)) return null;
    visited.add(personId);
    const mainPerson = data.find(p => p.id === personId);
    if (!mainPerson) return null;
    const spouse = mainPerson.spouseId ? data.find(p => p.id === mainPerson.spouseId) : null;
    if (spouse) visited.add(spouse.id);

    const childrenData = data.filter(p => p.fatherId === mainPerson.id || p.motherId === mainPerson.id || (spouse && (p.fatherId === spouse.id || p.motherId === spouse.id)));
    const children = childrenData.map(child => buildTree(child.id, new Set(visited))).filter(Boolean);
    return { main: mainPerson, spouse, children, hasChildren: children.length > 0 };
  };
  const treeData = useMemo(() => buildTree(rootId), [data, rootId]);

  // --- 7. Theme & Styles ---
  const theme = {
    bg: isDarkMode ? 'bg-slate-900' : 'bg-[#f4f7fa]',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-800',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    cardBg: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50',
    glassPanel: isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/90 border-white shadow-xl shadow-slate-200/50 backdrop-blur-xl',
    lineColor: isDarkMode ? '#475569' : '#94a3b8',
    dotColor: isDarkMode ? '#94a3b8' : '#64748b',
    dotPattern: isDarkMode ? 'radial-gradient(#1e293b 1.5px, transparent 1.5px)' : 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)'
  };

  // --- 8. Components (Card, Lines, Node) ---

  const RelationshipLine = ({ quality }) => {
    if (quality === 'conflict') return (
      <div className="relative w-12 md:w-16 h-[2px] shrink-0 mx-2 flex items-center">
         <div className="w-full border-t-[3px] border-red-500 border-dashed"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 border border-red-200 z-10"><Activity className="w-4 h-4 text-red-500" /></div>
      </div>
    );
    if (quality === 'divorced') return (
      <div className="relative w-12 md:w-16 border-t-[2px] border-slate-400 shrink-0 mx-2 flex items-center justify-center">
         <div className={`absolute px-1 text-[16px] font-black tracking-tighter transform -skew-x-12 ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-[#f4f7fa] text-slate-500'} z-10`} style={{ lineHeight: '10px' }}>//</div>
      </div>
    );
    if (quality === 'distant') return <div className="w-12 md:w-16 border-t-[3px] border-dashed border-slate-300 shrink-0 mx-2"></div>;
    if (quality === 'close') return <div className="w-12 md:w-16 h-[6px] border-y-[2px] border-emerald-400 shrink-0 mx-2 relative"></div>;
    return <div className="w-12 md:w-16 border-t-[2px] border-slate-400 shrink-0 mx-2 relative"></div>;
  };

  const PersonCard = ({ person }) => {
    if (!person) return null;
    const isMale = person.gender === 'M';
    const isFemale = person.gender === 'F';
    const isUnknown = person.gender === 'U';

    const isDeceased = person.status === 'deceased';
    const isIndex = person.isIndexPatient;
    const isHighlighted = searchQuery && `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const isAdopted = person.relationType === 'adopted';
    const isInPath = pathFinder.path.includes(person.id);
    const isStartNode = pathFinder.nodeA === person.id;
    const isEndNode = pathFinder.nodeB === person.id;
    const pathDimmed = pathFinder.active && pathFinder.nodeA && !isInPath && !isStartNode;

    // Clinical Shapes
    let shapeClass = "";
    let innerContent = getAvatarEmoji(person.gender, person.birthDate, person.nodeType);
    let shapeBorder = isIndex ? (isDarkMode ? 'border-[3px] border-double border-indigo-400' : 'border-[4px] border-double border-indigo-600') : (isDarkMode ? 'border-[2px] border-slate-500' : 'border-[2px] border-slate-600');
    let shapeBg = isDarkMode ? 'bg-slate-800' : 'bg-white';

    if (person.nodeType === 'person') {
      if (isMale) shapeClass = "w-14 h-14 rounded-sm";
      else if (isFemale) shapeClass = "w-14 h-14 rounded-full";
      else shapeClass = "w-12 h-12 rounded-sm rotate-45 transform mt-2 mb-2";
    } else if (person.nodeType === 'pregnant') {
      shapeClass = "w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-b-[45px] border-b-indigo-500 bg-transparent mb-2";
      shapeBg = "bg-transparent"; shapeBorder = "border-0"; innerContent = "";
    } else if (person.nodeType === 'miscarriage_spont') {
      shapeClass = `w-8 h-8 rounded-full ${isDarkMode ? 'bg-slate-300' : 'bg-slate-800'} mb-2`;
      shapeBg = "bg-transparent"; shapeBorder = "border-0"; innerContent = "";
    } else if (person.nodeType === 'miscarriage_induc') {
      shapeClass = "w-10 h-10 rounded-full mb-2 flex items-center justify-center";
      innerContent = <X className={`w-8 h-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`} strokeWidth={3} />;
    }

    let cardEffects = isIndex ? 'border-indigo-400 border-[2px]' : 'border-slate-200 border';
    if (isDarkMode) cardEffects = isIndex ? 'border-indigo-500 border-[2px]' : 'border-slate-700 border';
    if (isHighlighted) cardEffects += ' ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] scale-105 z-20';
    if (isInPath) cardEffects += ` ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)] scale-105 z-20 ${isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'}`;

    return (
      <div
        className={`no-drag group relative w-[130px] flex flex-col items-center rounded-xl transition-all duration-300 p-4 cursor-pointer
        ${theme.cardBg} ${cardEffects} ${pathDimmed ? 'opacity-20 grayscale scale-95' : 'hover:-translate-y-2 hover:shadow-2xl'}`}
        onClick={() => handleCardClick(person)}
      >
        {isIndex && <div className="absolute -top-3 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md z-10 no-print">ผู้ป่วยหลัก</div>}
        {isAdopted && <div className="absolute -top-3 bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md z-10 no-print">บุตรบุญธรรม</div>}
        {person.twinType !== 'none' && <div className="absolute -top-3 right-[-10px] bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md z-10 no-print">{person.twinType === 'identical' ? 'แฝดแท้' : 'แฝดต่าง'}</div>}
        {isStartNode && <div className="absolute -top-4 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg animate-bounce z-10">เริ่มต้น</div>}
        {isEndNode && <div className="absolute -top-4 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg animate-bounce z-10">เป้าหมาย</div>}

        {!pathFinder.active && viewMode === 'genogram' && (
          <>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-slate-800 text-white rounded-xl p-1 shadow-xl gap-1 z-50 no-print">
              <button onClick={(e) => { e.stopPropagation(); openEditModal(person); }} className="p-1.5 hover:bg-indigo-500 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(person.id); }} className="p-1.5 hover:bg-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-white border border-slate-200 rounded-xl p-1 shadow-lg gap-1 z-50 no-print">
              <button onClick={(e) => { e.stopPropagation(); openAddModal(person.id, isMale ? 'father' : 'mother'); }} className="px-2 py-1 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold text-black">+ ลูก</button>
              {!person.spouseId && <button onClick={(e) => { e.stopPropagation(); openAddModal(person.id, 'spouse'); }} className="px-2 py-1 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold text-black">+ แฟน</button>}
            </div>
          </>
        )}

        {/* Shape Render */}
        <div className={`relative flex items-center justify-center shadow-sm ${shapeClass} ${shapeBg} ${shapeBorder} ${isDeceased && person.nodeType==='person' ? 'grayscale opacity-70' : ''}`}>
          {person.nodeType === 'person' ? <span className={`text-3xl ${isUnknown ? '-rotate-45' : ''}`}>{innerContent}</span> : innerContent}
          {isDeceased && person.nodeType === 'person' && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <X className={`w-14 h-14 ${isDarkMode ? 'text-white' : 'text-slate-800'}`} strokeWidth={1.5} />
             </div>
          )}
        </div>

        <div className="text-center w-full mt-2">
          <p className={`font-bold text-sm truncate ${theme.text}`}>{person.firstName}</p>
          {(person.lastName || person.birthDate) && <p className={`text-[10px] truncate mt-0.5 ${theme.textMuted}`}>{person.lastName} {person.birthDate ? `(${person.birthDate})` : ''}</p>}
          {(person.diseases || isDeceased) && (
            <p className={`text-[9px] mt-1 font-bold ${isDeceased ? 'text-red-500' : 'text-amber-500'} truncate`}>
               {isDeceased && person.nodeType==='person' ? 'เสียชีวิต' : person.diseases}
            </p>
          )}
        </div>
      </div>
    );
  };

  const TreeNode = ({ node }) => {
    if (!node) return null;
    const isCollapsed = collapsedNodes.has(node.main.id);
    const hasParents = node.main.fatherId || node.main.motherId;

    return (
      <li className="relative">
        {hasParents && <div className="absolute left-1/2 -translate-x-1/2 z-20 rounded-full" style={{ top: '40px', width: '8px', height: '8px', backgroundColor: theme.dotColor, transform: 'translate(-50%, -50%)' }}></div>}
        <div className="inline-block relative">
          <div className="flex items-center justify-center relative z-10 px-2 py-8">
            <PersonCard person={node.main} />
            {node.spouse && (
              <>
                <RelationshipLine quality={node.main.spouseRel || 'normal'} />
                <PersonCard person={node.spouse} />
              </>
            )}
          </div>
          {node.hasChildren && (
            <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 z-30 no-drag no-print">
              <button onClick={(e) => { e.stopPropagation(); setCollapsedNodes(prev => { const n = new Set(prev); if(n.has(node.main.id)) n.delete(node.main.id); else n.add(node.main.id); return n;}); }}
                className={`flex items-center justify-center w-6 h-6 rounded-full shadow-md transition-all border ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}
              >
                {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
        {!isCollapsed && node.children && node.children.length > 0 && (
          <ul>{node.children.map((childNode, index) => <TreeNode key={childNode.main.id + index} node={childNode} />)}</ul>
        )}
      </li>
    );
  };

  // --- 9. Eco-Map Component ---
  const EcoMapView = () => {
    const centerPatient = data.find(p => p.isIndexPatient) || data[0];
    if (!centerPatient) return <div className="text-center mt-20 text-slate-500">กรุณาเพิ่มบุคคลก่อน</div>;
    const radius = 220; const centerX = 400; const centerY = 300;
    const getEcoIcon = (type) => {
      switch(type) {
        case 'health': return <Building className="w-6 h-6 text-emerald-500" />;
        case 'work': return <Briefcase className="w-6 h-6 text-amber-500" />;
        case 'school': return <GraduationCap className="w-6 h-6 text-blue-500" />;
        case 'social': return <Users className="w-6 h-6 text-indigo-500" />;
        case 'family': return <HeartHandshake className="w-6 h-6 text-rose-500" />;
        case 'religion': return <Map className="w-6 h-6 text-purple-500" />;
        default: return <Map className="w-6 h-6 text-slate-500" />;
      }
    };
    const handleEcoNodeSave = (e) => {
      e.preventDefault();
      if(editingEcoNode) setEcoNodes(ecoNodes.map(n => n.id === editingEcoNode ? ecoFormData : n));
      else setEcoNodes([...ecoNodes, { ...ecoFormData, id: 'E'+Date.now() }]);
      setIsEcoFormOpen(false);
    };

    return (
      <div className="relative w-full h-[600px] flex items-center justify-center">
        <div className={`absolute top-4 left-4 z-50 p-2 rounded-xl shadow-lg border no-print ${theme.glassPanel}`}>
          <button onClick={() => { setEditingEcoNode(null); setEcoFormData({ id: '', name: '', type: 'health', relation: 'strong' }); setIsEcoFormOpen(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-500">
            <Plus className="w-4 h-4" /> เพิ่มระบบแวดล้อม
          </button>
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
          {ecoNodes.map((node, index) => {
            const angle = (index / ecoNodes.length) * 2 * Math.PI - Math.PI / 2;
            const targetX = centerX + radius * Math.cos(angle);
            const targetY = centerY + radius * Math.sin(angle);
            let strokeColor = isDarkMode ? '#4f46e5' : '#6366f1';
            let strokeWidth = "4"; let strokeDasharray = "none";
            if (node.relation === 'distant') { strokeColor = isDarkMode ? '#64748b' : '#94a3b8'; strokeWidth = "3"; strokeDasharray = "8, 8"; }
            else if (node.relation === 'conflict') { strokeColor = '#ef4444'; strokeWidth = "3"; strokeDasharray = "6, 4"; }
            return (
              <g key={`line-${node.id}`}>
                <line x1="50%" y1="50%" x2={`calc(50% + ${targetX - centerX}px)`} y2={`calc(50% + ${targetY - centerY}px)`} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} className="transition-all duration-500" />
                {node.relation === 'conflict' && (
                  <foreignObject x={`calc(50% + ${(targetX - centerX)/2}px - 12px)`} y={`calc(50% + ${(targetY - centerY)/2}px - 12px)`} width="24" height="24">
                    <div className="bg-white rounded-full p-0.5 border-2 border-red-500 shadow-sm flex items-center justify-center animate-pulse"><Activity className="w-4 h-4 text-red-600" /></div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2" style={{ left: '50%', top: '50%' }}>
          <div className={`p-6 rounded-full border-4 border-double border-indigo-500 shadow-2xl flex flex-col items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="text-5xl mb-2">{getAvatarEmoji(centerPatient.gender, centerPatient.birthDate, centerPatient.nodeType)}</div>
            <p className="font-bold text-lg text-indigo-600 text-center whitespace-nowrap">{centerPatient.firstName} {centerPatient.lastName}</p>
            <p className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full mt-1 font-bold">ครอบครัว / ผู้ป่วยหลัก</p>
          </div>
        </div>

        {ecoNodes.map((node, index) => {
          const angle = (index / ecoNodes.length) * 2 * Math.PI - Math.PI / 2;
          const targetX = radius * Math.cos(angle); const targetY = radius * Math.sin(angle);
          const relText = node.relation === 'strong' ? 'เข้มแข็ง' : (node.relation === 'distant' ? 'ห่างเหิน' : 'บีบคั้น/กดดัน');
          const relColor = node.relation === 'strong' ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : (node.relation === 'distant' ? 'text-slate-500 bg-slate-50 border-slate-200' : 'text-red-600 bg-red-50 border-red-200');
          return (
            <div key={node.id} className={`absolute z-10 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110 cursor-pointer group`} style={{ left: `calc(50% + ${targetX}px)`, top: `calc(50% + ${targetY}px)` }} onClick={() => { setEditingEcoNode(node.id); setEcoFormData(node); setIsEcoFormOpen(true); }}>
              <div className={`w-28 h-28 rounded-full border-4 shadow-xl flex flex-col items-center justify-center bg-white ${relColor}`}>
                {getEcoIcon(node.type)}<p className="font-bold text-xs mt-2 text-center px-2 leading-tight">{node.name}</p>
                <div className="absolute -bottom-4 bg-slate-800 text-white text-[9px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">{relText} (คลิกแก้ไข)</div>
                <button onClick={(e) => { e.stopPropagation(); setEcoNodes(ecoNodes.filter(n => n.id !== node.id)); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-md hover:bg-red-600 transition-all no-print"><X className="w-3 h-3" /></button>
              </div>
            </div>
          );
        })}

        {isEcoFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 no-print animate-in zoom-in-95">
            <div className={`rounded-3xl shadow-2xl w-full max-w-sm p-6 relative border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
               <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Network className="w-5 h-5 text-indigo-500" /> {editingEcoNode ? 'แก้ไขสิ่งแวดล้อม' : 'เพิ่มสิ่งแวดล้อม'}</h2>
               <form onSubmit={handleEcoNodeSave} className="space-y-4">
                 <div><label className="text-xs font-bold opacity-70">ชื่อองค์กร / กลุ่มคน</label><input required type="text" className={`w-full p-3 mt-1 rounded-xl outline-none border ${isDarkMode?'bg-slate-800 border-slate-700':'bg-slate-50 border-slate-200'}`} value={ecoFormData.name} onChange={e => setEcoFormData({...ecoFormData, name: e.target.value})} placeholder="เช่น โรงเรียน, วัด" /></div>
                 <div><label className="text-xs font-bold opacity-70">ประเภท</label><select className={`w-full p-3 mt-1 rounded-xl outline-none border ${isDarkMode?'bg-slate-800 border-slate-700':'bg-slate-50 border-slate-200'}`} value={ecoFormData.type} onChange={e => setEcoFormData({...ecoFormData, type: e.target.value})}><option value="health">สาธารณสุข</option><option value="work">อาชีพ</option><option value="school">การศึกษา</option><option value="social">กลุ่มสังคม</option><option value="family">เครือญาติ</option><option value="religion">ศาสนา</option></select></div>
                 <div><label className="text-xs font-bold opacity-70">ความสัมพันธ์กับผู้ป่วย</label><select className={`w-full p-3 mt-1 rounded-xl outline-none border ${isDarkMode?'bg-slate-800 border-slate-700':'bg-slate-50 border-slate-200'}`} value={ecoFormData.relation} onChange={e => setEcoFormData({...ecoFormData, relation: e.target.value})}><option value="strong">เข้มแข็ง (เส้นทึบ)</option><option value="distant">ห่างเหิน (เส้นประ)</option><option value="conflict">บีบคั้น (เส้นหยักแดง)</option></select></div>
                 <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsEcoFormOpen(false)} className={`flex-1 p-3 rounded-xl font-bold ${isDarkMode?'bg-slate-800':'bg-slate-100'}`}>ยกเลิก</button><button type="submit" className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">บันทึก</button></div>
               </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- 11. Timeline Component ---
  const TimelineView = () => {
    const peopleWithEvents = data.filter(p => p.timeline && p.timeline.length > 0);
    return (
      <div className="family-timeline-scroll w-full h-[75vh] p-4 overflow-auto">
        <div className={`max-w-5xl mx-auto rounded-3xl shadow-xl p-8 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-8 border-b border-slate-200/50 pb-4">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl shadow-lg"><CalendarClock className="w-6 h-6" /></div>
            <div><h2 className={`text-2xl font-bold ${theme.text}`}>แผนผังเวลา (Time Line)</h2><p className={`text-sm ${theme.textMuted}`}>ลำดับเหตุการณ์สำคัญในครอบครัว</p></div>
          </div>
          {peopleWithEvents.length === 0 ? (
            <div className="text-center py-20 opacity-50"><Activity className="w-16 h-16 mx-auto mb-4" /><p>ยังไม่มีการบันทึกประวัติ (สามารถเพิ่มได้ในโหมดแก้ไขบุคคล)</p></div>
          ) : (
            <div className="space-y-6">
              {peopleWithEvents.map(person => (
                <div key={person.id} className={`p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-6 items-center md:items-start ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-32 shrink-0 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-4xl mb-2 ${isDarkMode ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>{getAvatarEmoji(person.gender, person.birthDate, person.nodeType)}</div>
                    <p className={`font-bold text-sm ${theme.text}`}>{person.firstName}</p>
                  </div>
                  <div className="flex-1 w-full relative pt-8 pb-2">
                    <div className={`absolute top-[38px] left-0 right-0 h-[3px] rounded-full ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
                    <div className="relative flex justify-between gap-6 overflow-x-auto pb-4">
                      {[...person.timeline].sort((a,b)=>a.year-b.year).map((item, idx) => (
                        <div key={idx} className="relative flex flex-col items-center shrink-0 min-w-[120px]">
                          <div className={`w-5 h-5 rounded-full z-10 border-4 shadow-md ${isDarkMode ? 'bg-amber-400 border-slate-800' : 'bg-amber-500 border-white'}`}></div>
                          <span className={`mt-3 text-xs font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700 shadow-sm'}`}>{item.year}</span>
                          <p className={`mt-2 text-xs text-center font-medium leading-tight max-w-[130px] ${theme.text}`}>{item.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`family-tree-root min-h-screen ${theme.bg} font-sans flex flex-col h-screen overflow-hidden transition-colors duration-500`}>

      {/* CSS FOR TREE & PRINT */}
      <style>{`
        .family-tree ul { padding-top: 40px; position: relative; display: flex; justify-content: center; padding-left: 0; margin: 0; }
        .family-tree li { text-align: center; list-style-type: none; position: relative; padding: 40px 10px 0 10px; }
        .family-tree li::before, .family-tree li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid ${theme.lineColor}; width: 50%; height: 40px; }
        .family-tree li::after { right: auto; left: 50%; border-left: 2px solid ${theme.lineColor}; }
        .family-tree li:only-child::after, .family-tree li:only-child::before { display: none; }
        .family-tree li:only-child { padding-top: 0; }
        .family-tree li:first-child::before, .family-tree li:last-child::after { border: 0 none; }
        .family-tree li:last-child::before { border-right: 2px solid ${theme.lineColor}; border-radius: 0; }
        .family-tree li:first-child::after { border-radius: 0; }
        .family-tree ul ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid ${theme.lineColor}; width: 0; height: 40px; transform: translateX(-50%); }

        @media print {
          body, html { background: white !important; color: black !important; height: auto !important; overflow: visible !important; }
          .no-print { display: none !important; }
          .family-tree-root { height: auto !important; min-height: 0 !important; overflow: visible !important; }
          .family-tree-wrapper { position: static !important; overflow: visible !important; height: auto !important; background-image: none !important; }
          .family-tree-container { position: static !important; transform: none !important; width: auto !important; height: auto !important; margin: 0 !important; }
          .family-tree { position: static !important; transform: none !important; margin: 20px auto !important; }
          .family-timeline-scroll { height: auto !important; overflow: visible !important; }
        }
      `}</style>

      {/* Loading Overlay */}
      {isExportingImage && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center text-white no-print">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
          <h3 className="text-xl font-bold">กำลังประมวลผลรูปภาพ...</h3>
        </div>
      )}

      {/* Top Navigation (Mode Switcher & Tools) */}
      <div className="absolute top-0 left-0 w-full z-40 px-6 py-4 pointer-events-none flex flex-col gap-4 no-print">
        <div className={`pointer-events-auto backdrop-blur-2xl rounded-3xl p-3 max-w-[95%] mx-auto w-full flex flex-wrap items-center justify-between gap-4 border ${theme.glassPanel}`}>

          <div className="flex items-center gap-4 pl-2">
            <a href="index.html" title="กลับสู่เครื่องคำนวณยา" className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white">
              <span className="text-xl">🌳</span>
            </a>
            <div>
              <h1 className={`text-xl font-extrabold tracking-tight hidden sm:block leading-tight ${theme.text}`}>Family<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500">Tree</span></h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Masterpiece Edition</p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className={`flex bg-slate-200/50 p-1 rounded-2xl ${isDarkMode ? 'bg-slate-800/80' : 'bg-slate-200/50'}`}>
             <button onClick={() => {setViewMode('genogram'); setPathFinder(p=>({...p, active:false}));}} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'genogram' ? 'bg-white text-indigo-600 shadow-sm' : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}>
               <Users className="w-4 h-4" /> <span className="hidden md:inline">Genogram</span>
             </button>
             <button onClick={() => {setViewMode('timeline'); setPathFinder(p=>({...p, active:false}));}} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'timeline' ? 'bg-white text-amber-500 shadow-sm' : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}>
               <CalendarClock className="w-4 h-4" /> <span className="hidden md:inline">Time Line</span>
             </button>
             <button onClick={() => {setViewMode('ecomap'); setPathFinder(p=>({...p, active:false}));}} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'ecomap' ? 'bg-white text-emerald-500 shadow-sm' : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}>
               <Network className="w-4 h-4" /> <span className="hidden md:inline">Eco-Map</span>
             </button>
          </div>

          <div className="flex items-center gap-2 pr-2">
            {viewMode === 'genogram' && (
              <>
                <div className="relative group hidden lg:block">
                  <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input type="text" placeholder="ค้นหาชื่อ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-2xl text-sm font-medium outline-none w-48 border ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-100 border-slate-200'}`} />
                </div>
                <button onClick={() => openAddModal()} className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
                  <UserPlus className="w-5 h-5" />
                </button>
                <button onClick={() => setPathFinder(p => ({ active: !p.active, nodeA: null, nodeB: null, path: [] }))}
                  className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all ${pathFinder.active ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : (isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600')}`}>
                  <Route className="w-5 h-5" />
                </button>
                <div className={`flex items-center gap-1 rounded-2xl px-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(2)))} title="ซูมออก"
                    className={`flex items-center justify-center w-8 h-10 rounded-xl transition-all ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className={`text-xs font-bold w-9 text-center select-none ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(2)))} title="ซูมเข้า"
                    className={`flex items-center justify-center w-8 h-10 rounded-xl transition-all ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="รีเซ็ตมุมมอง"
                    className={`flex items-center justify-center w-8 h-10 rounded-xl transition-all ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${isDarkMode ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-indigo-500'}`}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Export Sidebar Menu */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2 z-40 flex flex-col gap-3 pointer-events-auto no-drag no-print">
        <div className={`transition-all duration-300 ease-in-out ${isExportMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none absolute'}`}>
           <div className={`backdrop-blur-2xl rounded-3xl p-2.5 flex flex-col gap-2 border shadow-2xl ${theme.glassPanel} mb-3`}>
             <button onClick={handleExportImage} className={`flex items-center gap-3 p-3 rounded-2xl font-bold text-sm w-full transition-colors ${isDarkMode?'text-slate-200 hover:bg-slate-800':'text-slate-700 hover:bg-slate-100'}`}><div className="p-1.5 bg-blue-500/20 text-blue-500 rounded-lg"><ImageIcon className="w-4 h-4" /></div> รูปภาพ</button>
             <button onClick={() => {setIsExportMenuOpen(false); window.print();}} className={`flex items-center gap-3 p-3 rounded-2xl font-bold text-sm w-full transition-colors ${isDarkMode?'text-slate-200 hover:bg-slate-800':'text-slate-700 hover:bg-slate-100'}`}><div className="p-1.5 bg-rose-500/20 text-rose-500 rounded-lg"><Printer className="w-4 h-4" /></div> พิมพ์/PDF</button>
             <button onClick={handleExportCSV} className={`flex items-center gap-3 p-3 rounded-2xl font-bold text-sm w-full transition-colors ${isDarkMode?'text-slate-200 hover:bg-slate-800':'text-slate-700 hover:bg-slate-100'}`}><div className="p-1.5 bg-emerald-500/20 text-emerald-500 rounded-lg"><Table className="w-4 h-4" /></div> ไฟล์ Excel</button>
             <div className="h-px bg-slate-500/20 mx-2 my-1"></div>
             <button onClick={handleExportJSON} className={`flex items-center gap-3 p-3 rounded-2xl font-bold text-sm w-full transition-colors ${isDarkMode?'text-slate-200 hover:bg-slate-800':'text-slate-700 hover:bg-slate-100'}`}><div className="p-1.5 bg-amber-500/20 text-amber-500 rounded-lg"><Download className="w-4 h-4" /></div> Backup</button>
           </div>
        </div>
        <div className={`backdrop-blur-2xl rounded-3xl p-2.5 flex flex-col gap-2 border ${theme.glassPanel}`}>
          <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className={`p-3 rounded-2xl transition-all ${isExportMenuOpen ? 'bg-indigo-600 text-white shadow-lg' : (isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}><Share2 className="w-5 h-5" /></button>
          <button onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-2xl transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}><Upload className="w-5 h-5" /></button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className={`flex-1 overflow-hidden w-full relative family-tree-wrapper ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ backgroundImage: theme.dotPattern, backgroundSize: '30px 30px', backgroundPosition: `${pan.x}px ${pan.y}px` }}
        onMouseDown={viewMode === 'genogram' ? handleMouseDown : undefined}
        onMouseMove={viewMode === 'genogram' ? handleMouseMove : undefined}
        onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
      >
        <div className="absolute top-1/2 left-1/2 w-full h-full flex items-center justify-center family-tree-container transform -translate-x-1/2 -translate-y-1/2 mt-10">
          {viewMode === 'genogram' && (
            <div ref={treeContainerRef} className="family-tree transition-transform duration-200 origin-center absolute p-10" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, marginTop: '-10vh' }}>
              {treeData ? <ul><TreeNode node={treeData} /></ul> : null}
            </div>
          )}
          {viewMode === 'ecomap' && <EcoMapView />}
          {viewMode === 'timeline' && <TimelineView />}
        </div>
      </div>

      {/* Profile Modal (Book View) */}
      {isProfileOpen && selectedProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-in zoom-in-95">
          <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 bg-slate-500/20 hover:bg-slate-500/40 p-2 rounded-full transition-colors z-10"><X className="w-5 h-5 text-white" /></button>
            <div className={`pt-12 pb-6 px-8 text-center relative ${selectedProfile.status === 'deceased' ? 'bg-slate-800' : 'bg-gradient-to-br from-indigo-500 to-blue-600'} text-white`}>
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center border-4 border-white/20 bg-white/10 text-5xl mb-4 shadow-lg ${selectedProfile.status === 'deceased' ? 'grayscale' : ''}`}>
                {getAvatarEmoji(selectedProfile.gender, selectedProfile.birthDate, selectedProfile.nodeType)}
              </div>
              <h2 className="text-2xl font-bold">{selectedProfile.firstName} {selectedProfile.lastName}</h2>
              <p className="text-sm opacity-80 mt-1">{selectedProfile.birthDate ? `เกิดปี ${selectedProfile.birthDate}` : 'ไม่ทราบปีเกิด'} {selectedProfile.status === 'deceased' && ` - เสียชีวิต`}</p>
            </div>
            <div className={`p-8 space-y-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {selectedProfile.diseases && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex gap-3">
                  <Activity className="w-5 h-5 text-rose-500 mt-0.5" />
                  <div><h4 className="text-xs font-bold text-rose-500 uppercase tracking-wide">ประวัติสุขภาพ</h4><p className="text-sm mt-1">{selectedProfile.diseases}</p></div>
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2 border-b border-slate-500/20 pb-2"><BookOpen className="w-4 h-4 text-indigo-500" /> บันทึกเหตุการณ์ (Timeline)</h4>
                {(!selectedProfile.timeline || selectedProfile.timeline.length === 0) ? (
                  <div className="text-center py-4 text-sm opacity-50">ยังไม่มีการบันทึกประวัติ</div>
                ) : (
                  <div className="relative border-l-2 border-indigo-500/30 ml-2 pl-4 space-y-4 max-h-40 overflow-auto">
                    {[...selectedProfile.timeline].sort((a,b)=>a.year-b.year).map((item, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[23px] top-1 w-3 h-3 bg-indigo-500 rounded-full"></div>
                        <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full mb-1 inline-block">{item.year}</span>
                        <p className="text-sm">{item.event}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { setIsProfileOpen(false); openEditModal(selectedProfile); }} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30">
                <Edit2 className="w-4 h-4" /> แก้ไขข้อมูลบุคคล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Add/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 no-print overflow-y-auto">
          <div className={`rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative my-8 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="flex justify-between items-center mb-4 border-b border-slate-500/20 pb-3">
               <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-500">
                 <Edit2 className="w-5 h-5" /> {editingPerson ? 'แก้ไขข้อมูล' : 'เพิ่มโหนด / บุคคลใหม่'}
               </h2>
               <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full bg-slate-500/10 hover:bg-slate-500/20"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">

              <div className={`p-4 rounded-xl border mb-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-indigo-50 border-indigo-100'}`}>
                <p className="text-sm font-bold text-indigo-500 mb-2">ประเภทโหนด (Node Type)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="ntype" checked={formData.nodeType === 'person'} onChange={() => setFormData({...formData, nodeType: 'person'})} /> บุคคลปกติ</label>
                   <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="ntype" checked={formData.nodeType === 'pregnant'} onChange={() => setFormData({...formData, nodeType: 'pregnant', gender: 'U', status: 'alive'})} /> 🔺 ตั้งครรภ์</label>
                   <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="ntype" checked={formData.nodeType === 'miscarriage_spont'} onChange={() => setFormData({...formData, nodeType: 'miscarriage_spont', gender: 'U', status: 'deceased'})} /> ⚫ แท้งเอง</label>
                   <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="ntype" checked={formData.nodeType === 'miscarriage_induc'} onChange={() => setFormData({...formData, nodeType: 'miscarriage_induc', gender: 'U', status: 'deceased'})} /> ✖️ ทำแท้ง</label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs opacity-60">ชื่อ (หรือระบุสถานะ)</label><input required type="text" className={`w-full p-2.5 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                <div><label className="text-xs opacity-60">นามสกุล</label><input type="text" className={`w-full p-2.5 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs opacity-60">เพศ (รูปร่างการ์ด)</label>
                  <select className={`w-full p-2.5 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} disabled={formData.nodeType !== 'person'}>
                    <option value="M">ชาย (สี่เหลี่ยม)</option><option value="F">หญิง (วงกลม)</option><option value="U">ไม่ระบุ (ข้าวหลามตัด)</option>
                  </select>
                </div>
                <div><label className="text-xs opacity-60">ปีเกิด</label><input type="text" className={`w-full p-2.5 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} /></div>
                <div><label className="text-xs opacity-60">สถานะ</label>
                  <select className={`w-full p-2.5 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} disabled={formData.nodeType !== 'person'}>
                    <option value="alive">มีชีวิต</option><option value="deceased">เสียชีวิต (X)</option>
                  </select>
                </div>
              </div>

              <div><label className="text-xs font-bold text-rose-500">โรคประจำตัว / ปัญหาสุขภาพ</label><input type="text" className={`w-full p-2.5 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.diseases} onChange={e => setFormData({...formData, diseases: e.target.value})} /></div>

              <div className={`flex gap-4 p-3 rounded-xl border items-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 <input type="checkbox" id="isIndex" className="w-5 h-5 accent-indigo-600 rounded" checked={formData.isIndexPatient} onChange={e => setFormData({...formData, isIndexPatient: e.target.checked})} />
                 <label htmlFor="isIndex" className="text-sm font-bold text-indigo-500 cursor-pointer">กำหนดเป็น "ผู้ป่วยหลัก" (Index Patient - กรอบสองชั้น)</label>
              </div>

              <hr className="my-4 border-slate-500/20" />

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-3">
                   <p className="text-xs font-bold opacity-60">สายเลือด & พี่น้อง</p>
                   <div><label className="text-[10px] opacity-50">ประเภทบุตร</label>
                    <select className={`w-full p-2 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.relationType} onChange={e => setFormData({...formData, relationType: e.target.value})}><option value="biological">สายเลือดแท้</option><option value="adopted">บุตรบุญธรรม</option></select>
                   </div>
                   <div className="flex gap-2">
                     <div className="w-1/2"><label className="text-[10px] opacity-50">บิดา</label><select className={`w-full p-2 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.fatherId} onChange={e => setFormData({...formData, fatherId: e.target.value})}><option value="">- ไม่มี -</option>{data.filter(p=>p.id!==formData.id).map(p=><option key={p.id} value={p.id}>{p.firstName}</option>)}</select></div>
                     <div className="w-1/2"><label className="text-[10px] opacity-50">มารดา</label><select className={`w-full p-2 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.motherId} onChange={e => setFormData({...formData, motherId: e.target.value})}><option value="">- ไม่มี -</option>{data.filter(p=>p.id!==formData.id).map(p=><option key={p.id} value={p.id}>{p.firstName}</option>)}</select></div>
                   </div>
                   <div><label className="text-[10px] opacity-50">สถานะแฝด</label>
                    <select className={`w-full p-2 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.twinType} onChange={e => setFormData({...formData, twinType: e.target.value})}><option value="none">- ไม่ใช่แฝด -</option><option value="identical">แฝดแท้</option><option value="fraternal">แฝดต่าง</option></select>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <p className="text-xs font-bold opacity-60">ความสัมพันธ์คู่สมรส</p>
                   <div><label className="text-[10px] opacity-50">คู่สมรส</label><select className={`w-full p-2 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.spouseId} onChange={e => setFormData({...formData, spouseId: e.target.value})}><option value="">- ไม่มี -</option>{data.filter(p=>p.id!==formData.id).map(p=><option key={p.id} value={p.id}>{p.firstName}</option>)}</select></div>
                   <div>
                     <label className="text-[10px] opacity-50">ลักษณะความสัมพันธ์</label>
                     <select className={`w-full p-2 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={formData.spouseRel} onChange={e => setFormData({...formData, spouseRel: e.target.value})} disabled={!formData.spouseId}>
                        <option value="normal">ปกติ (เส้นทึบ)</option>
                        <option value="divorced">หย่าร้าง (เส้น //)</option>
                        <option value="close">สนิทมาก (เส้นคู่)</option>
                        <option value="conflict">ขัดแย้ง (เส้นหยักสีแดง)</option>
                        <option value="distant">ห่างเหิน (เส้นประ)</option>
                     </select>
                   </div>
                 </div>
              </div>

              {/* Timeline Editor */}
              <div className="pt-2">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold opacity-60">เหตุการณ์สำคัญ (Timeline)</p>
                    <button type="button" onClick={() => setFormData({...formData, timeline: [...formData.timeline, {year:'', event:''}]})} className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded"> + เพิ่มประวัติ </button>
                 </div>
                 <div className="space-y-2 max-h-32 overflow-y-auto">
                    {formData.timeline.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                         <input type="text" placeholder="ปี" className={`w-20 p-1.5 text-xs rounded border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} value={item.year} onChange={e => { const newTl=[...formData.timeline]; newTl[idx].year=e.target.value; setFormData({...formData, timeline: newTl}); }} />
                         <input type="text" placeholder="เหตุการณ์" className={`flex-1 p-1.5 text-xs rounded border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} value={item.event} onChange={e => { const newTl=[...formData.timeline]; newTl[idx].event=e.target.value; setFormData({...formData, timeline: newTl}); }} />
                         <button type="button" onClick={() => { const newTl = formData.timeline.filter((_, i) => i !== idx); setFormData({...formData, timeline: newTl}); }} className="text-red-500 p-1"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className={`flex-1 p-3 rounded-xl font-bold transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>ยกเลิก</button>
                <button type="submit" className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
