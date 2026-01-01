import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ⚠️ ضع معلوماتك هنا
const supabase = createClient("https://nlyujfsaanqchbjxbvrw.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5seXVqZnNhYW5xY2hianhidnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNzIxMjcsImV4cCI6MjA4Mjg0ODEyN30.EeCMljDcukll62djHZry2KmV4PX4SDH9e55GIS9Ji_o");

const SPECIALTIES = ["النجارة", "كهرباء سيارات", "أوتوميكاترونيكس", "طاقة متجددة", "اتصالات", "تجليس ودهان", "مساحة وبناء", "تطبيقات هواتف ذكية", "كهرباء استعمال", "صيانة حاسوب"];
const GRADES = ["الحادي عشر", "الثاني عشر"];

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // فلاتر
  const [selSpec, setSelSpec] = useState(null);
  const [selGrade, setSelGrade] = useState(null);
  
  // نموذج الإضافة
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");

  // 1. إدارة تسجيل الدخول بدقة
// استبدل الـ useEffect الأول بهذا الكود
  useEffect(() => {
    const initSession = async () => {
      try {
        console.log("Starting session check..."); // 1. تأكد أن الكود بدأ
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error("Supabase Error:", error); // سيظهر الخطأ في الكونسول
            throw error;
        }

        // استخدام await هنا لضمان انتهاء التحقق من الأدمن قبل إزالة التحميل
        await handleUserChange(data?.session?.user || null);
        
      } catch (err) {
        console.error("General Error:", err.message);
      } finally {
        // هذا السطر سيعمل مهما حدث، وسيلغي شاشة التحميل
        console.log("Finished loading.");
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

  // 2. جلب البيانات
  useEffect(() => {
    fetchData();
  }, [selSpec, selGrade]);

  async function fetchData() {
    let query = supabase.from("posts").select("*");
    if (selSpec) {
      query = query.eq("specialty", selSpec);
      if (selGrade) query = query.eq("grade", selGrade);
    } else {
      query = query.limit(6); // لوحة الشرف
    }
    const { data } = await query.order("created_at", { ascending: false });
    setPosts(data || []);
  }

  const handlePublish = async (e) => {
    e.preventDefault();
    const vId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([\w\-]{11})/)?.[1];
    if (!vId) return alert("❌ رابط يوتيوب غير صحيح");

    const { error } = await supabase.from("posts").insert([{ 
      title, description: desc, video_url: vId, specialty: selSpec, grade: selGrade, user_email: user.email 
    }]);
    
    if (!error) {
      alert("✅ تم النشر بنجاح");
      setTitle(""); setUrl(""); setDesc("");
      fetchData();
    }
  };

  if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontSize:'1.5rem'}}>جاري التحميل...</div>;

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navContent}>
          <h2 onClick={() => {setSelSpec(null); setSelGrade(null)}} style={styles.logo}>صناعية قلقيلية 🛠️</h2>
          {!user ? (
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })} style={styles.loginBtn}>دخول المعلمين</button>
          ) : (
            <div style={styles.userInfo}>
              <span style={styles.userEmail}>{isAdmin ? "الأستاذ المميز ✅" : user.email}</span>
              <button onClick={() => supabase.auth.signOut()} style={styles.logoutBtn}>خروج</button>
            </div>
          )}
        </div>
      </nav>

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>بوابة الإبداع الطلابي</h1>
        <p style={styles.headerSub}>المدرسة الثانوية الصناعية - قلقيلية</p>
      </header>

      <main style={styles.main}>
        {/* اختيار التخصص */}
        {!selSpec && (
          <div style={styles.grid}>
            {SPECIALTIES.map(s => (
              <div key={s} onClick={() => setSelSpec(s)} style={styles.cardSpec}>{s}</div>
            ))}
          </div>
        )}

        {/* اختيار الصف */}
        {selSpec && !selGrade && (
          <div style={styles.selectionBox}>
            <h3 style={{marginBottom: '20px'}}>قسم {selSpec}: اختر الصف</h3>
            <div style={{display:'flex', gap:'15px', justifyContent:'center'}}>
              {GRADES.map(g => (
                <button key={g} onClick={() => setSelGrade(g)} style={styles.btnGrade}>{g}</button>
              ))}
            </div>
            <button onClick={() => setSelSpec(null)} style={styles.btnBack}>العودة للرئيسية</button>
          </div>
        )}

        {/* نموذج الإضافة للأدمن */}
        {selSpec && selGrade && isAdmin && (
          <div style={styles.adminPanel}>
            <h3 style={{color: '#1e3a8a', marginBottom: '15px'}}>نشر عمل جديد في {selSpec}</h3>
            <form onSubmit={handlePublish} style={styles.form}>
              <input style={styles.input} placeholder="اسم الطالب والمشروع" value={title} onChange={e=>setTitle(e.target.value)} required />
              <input style={styles.input} placeholder="رابط يوتيوب" value={url} onChange={e=>setUrl(e.target.value)} required />
              <textarea style={styles.textarea} placeholder="وصف العمل..." value={desc} onChange={e=>setDesc(e.target.value)} required />
              <button type="submit" style={styles.btnSubmit}>نشر الآن 🚀</button>
            </form>
          </div>
        )}

        {/* العرض */}
        <div style={{marginTop: '40px'}}>
            <h2 style={styles.sectionTitle}>
                {!selSpec ? "⭐ أبرز أعمال الأسبوع ⭐" : `أعمال قسم ${selSpec} - ${selGrade}`}
            </h2>
            <div style={styles.videoGrid}>
                {posts.map(p => (
                    <div key={p.id} style={styles.videoCard}>
                        <div style={styles.iframeWrapper}>
                            <iframe src={`https://www.youtube.com/embed/${p.video_url}`} frameBorder="0" allowFullScreen></iframe>
                        </div>
                        <div style={styles.cardBody}>
                            <h4 style={styles.cardTitle}>{p.title}</h4>
                            <p style={styles.cardDesc}>{p.description}</p>
                            {isAdmin && (
                                <button onClick={async() => { if(confirm("حذف؟")){ await supabase.from('posts').delete().eq('id', p.id); fetchData(); } }} style={styles.delBtn}>حذف 🗑️</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {posts.length === 0 && <p style={styles.emptyMsg}>لا توجد أعمال لعرضها حالياً.</p>}
        </div>
      </main>

      <footer style={styles.footer}>
        <p>المدرسة الثانوية الصناعية - قلقيلية</p>
        <p style={{fontSize:'0.8rem', marginTop:'5px', color:'#94a3b8'}}>برمجة: أنس سمان | فكرة: محمد نزال</p>
      </footer>
    </div>
  );
}

// 🎨 كائنات التنسيق (Styles)
const styles = {
  container: { direction: 'rtl', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' },
  nav: { background: '#0f172a', color: '#fff', padding: '15px 5%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  navContent: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { cursor: 'pointer', margin: 0, fontSize: '1.4rem' },
  loginBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  userEmail: { fontSize: '0.9rem', color: '#cbd5e1' },
  logoutBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' },
  header: { background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: '#fff', padding: '60px 20px', textAlign: 'center' },
  headerTitle: { fontSize: '2.5rem', margin: 0 },
  headerSub: { fontSize: '1.1rem', opacity: 0.9, marginTop: '10px' },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' },
  cardSpec: { background: '#fff', padding: '30px 15px', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', transition: '0.2s', fontSize: '1.1rem' },
  selectionBox: { textAlign: 'center', background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' },
  btnGrade: { padding: '15px 40px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' },
  btnBack: { marginTop: '20px', display: 'block', width: '100%', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' },
  adminPanel: { background: '#f0f9ff', padding: '25px', borderRadius: '15px', border: '2px dashed #3b82f6' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' },
  textarea: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', minHeight: '80px' },
  btnSubmit: { background: '#10b981', color: '#fff', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  sectionTitle: { textAlign: 'center', color: '#1e293b', marginBottom: '30px' },
  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
  videoCard: { background: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  iframeWrapper: { position: 'relative', paddingBottom: '56.25%', height: 0 },
  cardBody: { padding: '20px' },
  cardTitle: { margin: '0 0 10px 0', color: '#1e293b' },
  cardDesc: { fontSize: '0.9rem', color: '#64748b', lineHeight: '1.4' },
  delBtn: { color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold', padding: 0 },
  emptyMsg: { textAlign: 'center', padding: '40px', color: '#94a3b8' },
  footer: { textAlign: 'center', padding: '40px', background: '#0f172a', color: '#fff', marginTop: '50px' }
};