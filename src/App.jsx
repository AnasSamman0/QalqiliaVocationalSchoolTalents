import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css"; // استيراد التنسيقات الجديدة

// إعداد Supabase
const supabase = createClient(
  "https://nlyujfsaanqchbjxbvrw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5seXVqZnNhYW5xY2hianhidnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNzIxMjcsImV4cCI6MjA4Mjg0ODEyN30.EeCMljDcukll62djHZry2KmV4PX4SDH9e55GIS9Ji_o"
);

const SPECIALTIES = [
  "النجارة", "كهرباء سيارات", "أوتوميكاترونيكس", "طاقة متجددة",
  "اتصالات", "تجليس ودهان", "مساحة وبناء", "تطبيقات هواتف ذكية",
  "كهرباء استعمال", "صيانة حاسوب"
];
const GRADES = ["الحادي عشر", "الثاني عشر"];

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // فلاتر التصفح
  const [selSpec, setSelSpec] = useState(null);
  const [selGrade, setSelGrade] = useState(null);

  // حقول نموذج الإضافة
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");

  // 1. إدارة الجلسة والتحقق من المستخدم
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        await handleUserChange(data?.session?.user || null);
      } catch (err) {
        console.error("Session Error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserChange(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserChange = async (currentUser) => {
    if (currentUser) {
      setUser(currentUser);
      // التحقق مما إذا كان المستخدم أدمن
      const { data } = await supabase
        .from('admins')
        .select('email')
        .eq('email', currentUser.email.toLowerCase())
        .maybeSingle();
      setIsAdmin(!!data);
    } else {
      setUser(null);
      setIsAdmin(false);
    }
  };

  // 2. جلب البيانات من قاعدة البيانات
  useEffect(() => {
    fetchData();
  }, [selSpec, selGrade]);

  async function fetchData() {
    let query = supabase.from("posts").select("*");
    
    if (selSpec) {
      query = query.eq("specialty", selSpec);
      if (selGrade) query = query.eq("grade", selGrade);
    } else {
      query = query.limit(9); // عرض آخر 9 أعمال في الصفحة الرئيسية
    }

    const { data } = await query.order("created_at", { ascending: false });
    setPosts(data || []);
  }

  // 3. نشر عمل جديد
  const handlePublish = async (e) => {
    e.preventDefault();
    // استخراج ID الفيديو من الرابط
    const vId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([\w\-]{11})/)?.[1];
    
    if (!vId) return alert("❌ رابط يوتيوب غير صحيح، يرجى التأكد من الرابط.");

    const { error } = await supabase.from("posts").insert([{ 
      title, 
      description: desc, 
      video_url: vId, 
      specialty: selSpec, 
      grade: selGrade, 
      user_email: user.email 
    }]);
    
    if (!error) {
      alert("✅ تم النشر بنجاح!");
      setTitle(""); setUrl(""); setDesc("");
      fetchData();
    } else {
      alert("حدث خطأ أثناء النشر.");
    }
  };

  // شاشة التحميل
  if (loading) return (
    <div className="loading-screen">
      <div>جاري تحميل بوابة الإبداع...</div>
    </div>
  );

  return (
    <div className="container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-content">
          <h2 onClick={() => {setSelSpec(null); setSelGrade(null)}} className="logo">
            صناعية قلقيلية 🛠️
          </h2>
          
          {!user ? (
            <button 
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })} 
              className="btn btn-primary"
            >
              دخول المعلمين
            </button>
          ) : (
            <div className="user-info">
              <span className="user-email">{isAdmin ? "الأستاذ المشرف ✅" : user.email}</span>
              <button onClick={() => supabase.auth.signOut()} className="btn btn-danger">خروج</button>
            </div>
          )}
        </div>
      </nav>

      {/* Header Banner */}
      <header className="header">
        <h1>بوابة الإبداع الطلابي</h1>
        <p>المدرسة الثانوية الصناعية - قلقيلية</p>
      </header>

      <main className="main-content">
        
        {/* 1. اختيار التخصص (الصفحة الرئيسية) */}
        {!selSpec && (
          <>
             <h2 className="section-title">⭐ اختر التخصص للتصفح ⭐</h2>
             <div className="grid">
              {SPECIALTIES.map(s => (
                <div key={s} onClick={() => setSelSpec(s)} className="card-spec">
                  {s}
                </div>
              ))}
            </div>
             <div style={{marginTop: '50px'}}>
               <h2 className="section-title">✨ أحدث الأعمال المضافة</h2>
               <div className="video-grid">
                  {posts.map(p => <VideoCard key={p.id} p={p} isAdmin={isAdmin} onDelete={fetchData} />)}
               </div>
             </div>
          </>
        )}

        {/* 2. اختيار الصف */}
        {selSpec && !selGrade && (
          <div className="selection-box">
            <h3>قسم {selSpec}</h3>
            <p style={{color:'#64748b', margin:'10px 0'}}>يرجى اختيار الصف الدراسي لعرض المشاريع</p>
            <div className="grades-wrapper">
              {GRADES.map(g => (
                <button key={g} onClick={() => setSelGrade(g)} className="btn-grade">
                  {g}
                </button>
              ))}
            </div>
            <button onClick={() => setSelSpec(null)} className="btn btn-back">العودة للتخصصات</button>
          </div>
        )}

        {/* 3. عرض المشاريع داخل التخصص والصف */}
        {selSpec && selGrade && (
          <div>
            <button onClick={() => {setSelSpec(null); setSelGrade(null)}} className="btn btn-main-back">
              🏠 العودة للقائمة الرئيسية
            </button>

            {/* نموذج الإضافة للأدمن فقط */}
            {isAdmin && (
              <div className="admin-panel">
                <h3 style={{color: '#1e3a8a', marginBottom: '15px'}}>نشر عمل جديد في {selSpec} - {selGrade}</h3>
                <form onSubmit={handlePublish} className="form">
                  <input className="input-field" placeholder="عنوان المشروع / اسم الطالب" value={title} onChange={e=>setTitle(e.target.value)} required />
                  <input className="input-field" placeholder="رابط الفيديو (YouTube)" value={url} onChange={e=>setUrl(e.target.value)} required />
                  <textarea className="input-field" placeholder="وصف موجز للمشروع..." rows="3" value={desc} onChange={e=>setDesc(e.target.value)} required />
                  <button type="submit" className="btn btn-success">نشر المشروع 🚀</button>
                </form>
              </div>
            )}

            <h2 className="section-title">أعمال قسم {selSpec} - {selGrade}</h2>

            <div className="video-grid">
              {posts.length > 0 ? (
                posts.map(p => (
                  <VideoCard key={p.id} p={p} isAdmin={isAdmin} onDelete={fetchData} />
                ))
              ) : (
                <p style={{textAlign:'center', color:'#94a3b8', width:'100%', gridColumn:'1/-1'}}>لا توجد أعمال مضافة في هذا القسم حتى الآن.</p>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - المدرسة الثانوية الصناعية - قلقيلية</p>
        <p style={{fontSize:'0.8rem', marginTop:'8px', color:'#94a3b8'}}>
          تصميم وبرمجة: أنس سمان | فكرة وإشراف: محمد نزال
        </p>
      </footer>
    </div>
  );
}

// مكون فرعي لبطاقة الفيديو (لتقليل تكرار الكود)
function VideoCard({ p, isAdmin, onDelete }) {
  const handleDelete = async () => {
    if (confirm("هل أنت متأكد من حذف هذا المشروع؟")) {
       await supabase.from('posts').delete().eq('id', p.id);
       onDelete();
    }
  };

  return (
    <div className="video-card">
      <div className="iframe-container">
        <iframe 
          src={`https://www.youtube.com/embed/${p.video_url}`} 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen 
          title={p.title}
        ></iframe>
      </div>
      <div className="card-body">
        <h4 className="card-title">{p.title}</h4>
        <p className="card-desc">{p.description}</p>
        {isAdmin && (
          <button onClick={handleDelete} className="btn-delete">حذف العمل 🗑️</button>
        )}
      </div>
    </div>
  );
}
