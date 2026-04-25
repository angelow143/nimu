"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, update: updateSession } = useSession();
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Lightbox state for Albums
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Content State
  const [content, setContent] = useState({
    name: "Nimu",
    introTitle: "Hi there, I'm Nimu!",
    introDesc: "I'm a passionate graphic designer with 5+ years of experience creating beautiful and functional designs.",
    photo: "/assets/photo.jpg"
  });

  // Projects State
  const [projects, setProjects] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fileInputRef = useRef(null);
  const profileUploadRef = useRef(null);
  const projectFileInputRef = useRef(null);
  const addPhotosToProjectRef = useRef(null);
  const userMenuRef = useRef(null);
  const [targetProjectId, setTargetProjectId] = useState(null);

  // User Management State
  const [showAllUsersModal, setShowAllUsersModal] = useState(false);
  const [userList, setUserList] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [passwordChangeId, setPasswordChangeId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", password: "" });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [visiblePasswords, setVisiblePasswords] = useState(new Set());

  useEffect(() => {
    setMounted(true);

    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");

    const loadData = async () => {
      try {
        const [contentRes, projectsRes] = await Promise.all([
          fetch("/api/portfolio"),
          fetch("/api/projects")
        ]);
        if (contentRes.ok) setContent(await contentRes.json());
        if (projectsRes.ok) setProjects(await projectsRes.json());
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch comments when album opens
  useEffect(() => {
    if (activeAlbum) {
      fetch(`/api/comments?projectId=${activeAlbum.id}`)
        .then(res => res.json())
        .then(data => setComments(data))
        .catch(err => console.error(err));
    } else {
      setComments([]);
    }
  }, [activeAlbum]);

  const saveContentToServer = async (newContent) => {
    try {
      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContent),
      });
    } catch (err) { console.error(err); }
  };

  const saveProjectsToServer = async (newProjects) => {
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProjects),
      });
    } catch (err) { console.error(err); }
  };

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        try {
          const res = await fetch("/api/user/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64 }),
          });
          if (res.ok) {
            const data = await res.json();
            // Update the local session with the new image URL
            await updateSession({ image: data.image });
            setShowUserMenu(false);
          }
        } catch (err) { console.error(err); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;
    setIsPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeAlbum.id, text: newComment }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments([...comments, comment]);
        setNewComment("");
      }
    } catch (err) { console.error(err); } finally { setIsPosting(false); }
  };

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUserList(await res.json());
    } catch (err) { console.error(err); }
    finally { setIsUsersLoading(false); }
  };

  const handleUpdateUser = async (userId) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...editForm })
      });
      if (res.ok) {
        setEditingUserId(null);
        fetchUsers();
      }
    } catch (err) { console.error(err); }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm)
      });
      if (res.ok) {
        setIsAddingUser(false);
        setNewUserForm({ name: "", email: "", password: "", role: "user" });
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add user");
      }
    } catch (err) { console.error(err); }
  };

  const togglePasswordVisibility = (userId) => {
    const next = new Set(visiblePasswords);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setVisiblePasswords(next);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
    if (newMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newContent = { ...content, photo: reader.result };
        setContent(newContent);
        saveContentToServer(newContent);
      };
      reader.readAsDataURL(file);
    }
  };

  const addProject = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const imagePromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });
      const base64Images = await Promise.all(imagePromises);
      const newProject = {
        id: Date.now().toString(),
        title: "New Album",
        subtitle: new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
        images: base64Images,
        date: new Date().toISOString()
      };
      const newProjects = [newProject, ...projects];
      setProjects(newProjects);
      saveProjectsToServer(newProjects);
    }
  };

  const addPhotosToExistingProject = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && targetProjectId) {
      const imagePromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });
      const base64Images = await Promise.all(imagePromises);
      const newProjects = projects.map(p => p.id === targetProjectId ? { ...p, images: [...p.images, ...base64Images] } : p);
      setProjects(newProjects);
      saveProjectsToServer(newProjects);
      setTargetProjectId(null);
    }
  };

  const deletePhotoFromProject = (projectId, imgIndex) => {
    const project = projects.find(p => p.id === projectId);
    if (project.images.length <= 1) {
      alert("An album must have at least one photo.");
      return;
    }
    if (confirm("Delete this photo?")) {
      const newProjects = projects.map(p => {
        if (p.id === projectId) {
          const newImages = [...p.images];
          newImages.splice(imgIndex, 1);
          return { ...p, images: newImages };
        }
        return p;
      });
      setProjects(newProjects);
      saveProjectsToServer(newProjects);
    }
  };

  const updateProject = (id, field, value) => {
    const newProjects = projects.map(p => p.id === id ? { ...p, [field]: value } : p);
    setProjects(newProjects);
    saveProjectsToServer(newProjects);
  };

  const deleteProject = (id) => {
    if (confirm("Delete this entire album?")) {
      const newProjects = projects.filter(p => p.id !== id);
      setProjects(newProjects);
      saveProjectsToServer(newProjects);
    }
  };

  const nextImg = (e) => {
    e?.stopPropagation();
    if (activeAlbum) setCurrentImgIndex((prev) => (prev + 1) % activeAlbum.images.length);
  };

  const prevImg = (e) => {
    e?.stopPropagation();
    if (activeAlbum) setCurrentImgIndex((prev) => (prev - 1 + activeAlbum.images.length) % activeAlbum.images.length);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-dvh min-w-80 bg-white text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-2xl font-thin tracking-widest hover:text-purple-600 dark:hover:text-purple-400">
              {content.name}
            </Link>
            <button onClick={toggleDarkMode} className="relative inline-flex size-9 items-center justify-center text-zinc-600 hover:opacity-75 dark:text-zinc-400">
              <SunIcon className={`transition-all duration-300 ${darkMode ? "opacity-0 rotate-180 scale-0" : "opacity-100 rotate-0 scale-100"}`} />
              <MoonIcon className={`absolute transition-all duration-300 ${!darkMode ? "opacity-0 rotate-180 scale-0" : "opacity-100 rotate-0 scale-100"}`} />
            </button>
          </div>

          <nav className="flex items-center gap-6">
            <a href="#projects" className="text-sm font-medium hover:underline underline-offset-8 decoration-purple-600">Projects</a>
            <a href="#contact" className="text-sm font-medium hover:underline underline-offset-8 decoration-purple-600">Hire me</a>

            {session ? (
              <div className="relative ml-2 pl-4 border-l border-zinc-200 dark:border-zinc-800" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:opacity-80 transition-all"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      {session.user.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium leading-none">
                      {session.user.role === "admin" ? "ADMIN" : "MEMBER"}
                    </span>
                  </div>
                  <div className="size-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs uppercase shadow-sm border border-zinc-300 dark:border-zinc-700">
                    {session.user.image ? (
                      <img src={session.user.image} className="size-full object-cover" />
                    ) : (
                      session.user.name.charAt(0)
                    )}
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Settings</p>
                    </div>

                    <button
                      onClick={() => profileUploadRef.current.click()}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-700 dark:text-zinc-300"
                    >
                      <PhotoIcon className="size-4 text-purple-500" />
                      Upload Profile
                    </button>
                    <input type="file" ref={profileUploadRef} onChange={handleProfilePhotoChange} className="hidden" accept="image/*" />

                    {session.user.role === "admin" && (
                      <button
                        onClick={() => { setIsEditing(!isEditing); setShowUserMenu(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${isEditing ? "bg-purple-600 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"}`}
                      >
                        {isEditing ? <CheckIcon className="size-4" /> : <EditIcon className="size-4 text-purple-500" />}
                        {isEditing ? "Done Editing" : "Edit Portfolio"}
                      </button>
                    )}

                    {session.user.role === "useradmin" && (
                      <button
                        onClick={() => { setShowAllUsersModal(true); setShowUserMenu(false); fetchUsers(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      >
                        <UserIcon className="size-4 text-blue-500" />
                        All Users
                      </button>
                    )}

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <LogoutIcon className="size-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="ml-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-zinc-500/20">Login</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-auto flex-col px-4 pb-4 lg:px-8 lg:pb-8 pt-8">
        {isLoadingData ? (
          <div className="flex-1 flex flex-col items-center justify-center py-40 gap-4">
            <div className="size-12 border-4 border-zinc-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-zinc-500 font-medium animate-pulse">Syncing with server...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div onClick={() => !isEditing && setActiveAlbum({ id: "profile", images: [content.photo], title: content.name, subtitle: "Profile Photo" })} className={`col-span-1 md:col-span-5 relative group overflow-hidden rounded-xl ${!isEditing ? "cursor-zoom-in" : ""}`}>
              <Image src={content.photo} alt="Profile" width={800} height={800} className="rounded-xl object-cover w-full aspect-square transition-transform duration-500 group-hover:scale-105" priority />
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }} className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm">Change Photo</button>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                </div>
              )}
            </div>

            <div className="relative col-span-1 flex flex-col overflow-hidden rounded-xl bg-zinc-100 p-12 md:col-span-7 dark:bg-zinc-900">
              <div className="relative mt-auto">
                {isEditing ? (
                  <div className="space-y-4">
                    <input value={content.introTitle} onChange={(e) => { const c = { ...content, introTitle: e.target.value }; setContent(c); saveContentToServer(c); }} className="text-4xl font-medium bg-transparent border-b border-purple-500 w-full outline-none" />
                    <textarea value={content.introDesc} onChange={(e) => { const c = { ...content, introDesc: e.target.value }; setContent(c); saveContentToServer(c); }} rows="4" className="w-full bg-transparent border border-purple-500/30 rounded-lg p-2 outline-none" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-medium">{content.introTitle}</h1>
                    <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">{content.introDesc}</p>
                  </>
                )}
              </div>
            </div>

            <div id="projects" className="col-span-12 mt-12 mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Projects Album</h2>
              {isEditing && (
                <>
                  <button onClick={() => projectFileInputRef.current.click()} className="bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-600 transition-all">
                    <PlusIcon className="size-4" /> New Album
                  </button>
                  <input type="file" ref={projectFileInputRef} onChange={addProject} className="hidden" accept="image/*" multiple />
                </>
              )}
            </div>

            {projects.map((project) => (
              <div key={project.id} onClick={() => { if (!isEditing) { setActiveAlbum(project); setCurrentImgIndex(0); } }} className={`group relative col-span-1 md:col-span-4 overflow-hidden rounded-xl bg-zinc-100 p-6 dark:bg-zinc-900 hover:bg-zinc-200/75 dark:hover:bg-zinc-800 transition-all ${!isEditing ? "cursor-zoom-in" : ""}`}>
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                  <span className="bg-white/90 dark:bg-zinc-800/90 px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">{project.images.length} {project.images.length === 1 ? "PHOTO" : "PHOTOS"}</span>
                  {isEditing && (
                    <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><TrashIcon className="size-3.5" /></button>
                  )}
                </div>
                <div className="relative z-10">
                  {isEditing ? (
                    <div className="space-y-1 mb-4" onClick={e => e.stopPropagation()}>
                      <input value={project.title} onChange={e => updateProject(project.id, "title", e.target.value)} className="w-full bg-transparent border-b border-purple-500 outline-none font-medium" />
                      <input value={project.subtitle} onChange={e => updateProject(project.id, "subtitle", e.target.value)} className="w-full bg-transparent text-sm text-zinc-500 outline-none" />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium">{project.title}</h3>
                      <h4 className="text-sm text-zinc-500">{project.subtitle}</h4>
                    </>
                  )}
                </div>
                <div className="mt-10 relative">
                  <Image src={project.images[0]} alt={project.title} width={400} height={400} className="rounded-xl object-contain w-full aspect-square shadow-sm transition group-hover:scale-105" />
                  {isEditing && (
                    <div className="mt-4 p-3 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-2">
                        {project.images.map((img, idx) => (
                          <div key={idx} className="relative size-10 group/thumb">
                            <img src={img} className="size-full object-cover rounded-md border border-zinc-300 dark:border-zinc-700" />
                            <button onClick={() => deletePhotoFromProject(project.id, idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity"><XMarkIcon className="size-2.5" /></button>
                          </div>
                        ))}
                        <button onClick={() => { setTargetProjectId(project.id); setTimeout(() => addPhotosToProjectRef.current.click(), 100); }} className="size-10 border-2 border-dashed border-zinc-400 rounded-md flex items-center justify-center text-zinc-400 hover:border-purple-500 transition-colors"><PlusIcon className="size-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <section id="contact" className="col-span-12 mt-20 mb-12">
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-3xl rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-3xl rounded-full -ml-20 -mb-20" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Let's work together</h2>
                <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                  I'm currently available for freelance work and full-time opportunities.
                  Have a project in mind? Let's discuss how we can bring your vision to life.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm">
                      <ChatIcon className="size-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Email me at</p>
                      <p className="text-sm font-medium">{content.email || "angelowlarot@msunaawan.edu.ph"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Name" className="bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-zinc-200 dark:ring-zinc-700 focus:ring-purple-500 transition-all" />
                  <input type="email" placeholder="Email" className="bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-zinc-200 dark:ring-zinc-700 focus:ring-purple-500 transition-all" />
                </div>
                <textarea placeholder="Tell me about your project..." rows="4" className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-zinc-200 dark:ring-zinc-700 focus:ring-purple-500 transition-all" />
                <button className="w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 py-4 rounded-xl font-bold text-sm shadow-xl shadow-zinc-500/10 hover:opacity-90 transition-all active:scale-[0.98]">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>

        <footer className="col-span-12 py-12 text-center text-sm border-t border-zinc-100 dark:border-zinc-800 mt-8">
          <p className="text-zinc-500">{content.name} © {new Date().getFullYear()} • <Link href="https://www.facebook.com/Angelow143" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">Facebook</Link></p>
        </footer>
      </main>

      {/* Album Slider Lightbox */}
      {activeAlbum && (
        <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-black/95 backdrop-blur-md transition-all animate-in fade-in duration-300">
          <div className="flex-1 relative flex items-center justify-center p-4 md:p-8" onClick={() => setActiveAlbum(null)}>
            <button className="absolute top-6 left-6 text-white/70 hover:text-white md:hidden" onClick={() => setActiveAlbum(null)}><XMarkIcon className="size-8" /></button>
            {activeAlbum.images.length > 1 && (
              <>
                <button className="absolute left-4 md:left-8 text-white/50 hover:text-white transition-all bg-white/5 p-3 rounded-full hover:bg-white/10 z-[60]" onClick={prevImg}><ChevronLeftIcon className="size-8 md:size-10" /></button>
                <button className="absolute right-4 md:right-8 text-white/50 hover:text-white transition-all bg-white/5 p-3 rounded-full hover:bg-white/10 z-[60]" onClick={nextImg}><ChevronRightIcon className="size-8 md:size-10" /></button>
              </>
            )}
            <div className="relative max-w-full max-h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <img src={activeAlbum.images[currentImgIndex]} alt="Preview" className="max-w-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-lg shadow-2xl transition-all duration-500" />
              <div className="mt-6 text-center text-white">
                <h3 className="text-xl font-medium">{activeAlbum.title}</h3>
                <p className="text-white/50 text-sm">{activeAlbum.subtitle}</p>
                <p className="text-white/30 text-[10px] mt-2 uppercase tracking-[0.2em]">{currentImgIndex + 1} / {activeAlbum.images.length}</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-96 bg-zinc-100 dark:bg-zinc-900 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h4 className="font-bold text-lg">Comments</h4>
              <button className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white" onClick={() => setActiveAlbum(null)}><XMarkIcon className="size-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {comments.length === 0 ? (
                <div className="text-center py-20 text-zinc-400">
                  <ChatIcon className="size-12 mx-auto opacity-20 mb-4" />
                  <p>No comments yet.</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="group flex gap-3">
                    <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-[10px] uppercase shrink-0 shadow-sm border border-zinc-300 dark:border-zinc-700 overflow-hidden">
                      {comment.user_image ? (
                        <img src={comment.user_image} className="size-full object-cover" />
                      ) : (
                        comment.user_name ? comment.user_name.charAt(0) : "?"
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-purple-600 dark:text-purple-400">{comment.user_name || "Unknown User"}</span>
                        <span className="text-[10px] text-zinc-400">{new Date(comment.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm bg-white dark:bg-zinc-800 p-3 rounded-xl rounded-tl-none shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
              {session ? (
                <form onSubmit={handlePostComment} className="space-y-3">
                  <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." rows="3" className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 text-sm outline-none" />
                  <button disabled={isPosting || !newComment.trim()} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-500 transition-all disabled:opacity-50">{isPosting ? "Posting..." : "Post Comment"}</button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-zinc-500 mb-4">You must be logged in to comment.</p>
                  <Link href="/login" className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-6 py-2 rounded-full text-sm font-bold">Login / Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Users Modal for USERADMIN */}
      {showAllUsersModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <div>
                <h2 className="text-xl font-bold">User Management</h2>
                <p className="text-sm text-zinc-500">Manage all registered accounts</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddingUser(!isAddingUser)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="size-4" />
                  {isAddingUser ? "Cancel" : "Add User"}
                </button>
                <button onClick={() => setShowAllUsersModal(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <XMarkIcon className="size-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {isAddingUser && (
                <form onSubmit={handleAddUser} className="mb-8 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="font-bold mb-4">Add New User</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text" placeholder="Name" required
                      className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-zinc-200 dark:ring-zinc-700"
                      value={newUserForm.name} onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    />
                    <input
                      type="text" placeholder="Email / Username" required
                      className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-zinc-200 dark:ring-zinc-700"
                      value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    />
                    <input
                      type="password" placeholder="Password" required
                      className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-zinc-200 dark:ring-zinc-700"
                      value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    />
                    <select
                      className="bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-zinc-200 dark:ring-zinc-700"
                      value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    >
                      <option value="user">Member</option>
                      <option value="useradmin">User Admin</option>
                      <option value="admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button type="submit" className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-8 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg">Save User</button>
                  </div>
                </form>
              )}

              {isUsersLoading ? (
                <div className="flex justify-center py-20"><div className="size-10 border-4 border-zinc-200 border-t-blue-600 rounded-full animate-spin"></div></div>
              ) : (
                <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-800 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-[11px] uppercase tracking-wider">
                        <th className="px-6 py-4 font-bold">Name</th>
                        <th className="px-6 py-4 font-bold">Email / Username</th>
                        <th className="px-6 py-4 font-bold">Role</th>
                        <th className="px-6 py-4 font-bold">Password</th>
                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {userList.map((user) => (
                        <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-sm">
                            {editingUserId === user.id ? (
                              <input
                                type="text" className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 w-full text-sm outline-none"
                                value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                              />
                            ) : user.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {editingUserId === user.id ? (
                              <input
                                type="text" className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 w-full text-sm outline-none"
                                value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                              />
                            ) : user.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                              user.role === 'useradmin' ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-600'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 group/pass">
                              {editingUserId === user.id ? (
                                <input
                                  type="text" className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 w-full text-sm outline-none"
                                  value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                />
                              ) : (
                                <>
                                  <span className="text-sm font-mono bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded">
                                    {visiblePasswords.has(user.id) ? user.password : "••••••••"}
                                  </span>
                                  <button onClick={() => togglePasswordVisibility(user.id)} className="text-zinc-400 hover:text-blue-500 transition-colors">
                                    {visiblePasswords.has(user.id) ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {editingUserId === user.id ? (
                              <div className="flex items-center gap-2 justify-end">
                                <button onClick={() => handleUpdateUser(user.id)} className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-500"><CheckIcon className="size-4" /></button>
                                <button onClick={() => setEditingUserId(null)} className="text-zinc-400 hover:text-zinc-600"><XMarkIcon className="size-4" /></button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingUserId(user.id);
                                  setEditForm({ name: user.name, email: user.email, password: user.password });
                                }}
                                className="text-xs font-bold text-blue-600 hover:underline"
                              >
                                Edit User
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={projectFileInputRef} onChange={addProject} className="hidden" accept="image/*" multiple />
    </div>
  );
}

// Icons
function SunIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>; }
function MoonIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>; }
function PlusIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>; }
function TrashIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 12m-4.72 0-.34-12M4.5 18.094c0 .354.128.692.353.957a1.455 1.455 0 0 0 1.054.444h12.186c.38 0 .744-.16 1.054-.444a1.455 1.455 0 0 0 .353-.957V6H4.5v12.094ZM19 6V4.5A1.5 1.5 0 0 0 17.5 3h-11A1.5 1.5 0 0 0 5 4.5V6m14 0H5" /></svg>; }
function XMarkIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>; }
function ChevronLeftIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>; }
function ChevronRightIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>; }
function ChatIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>; }
function LogoutIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>; }
function EditIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>; }
function CheckIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>; }
function PhotoIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>; }
function UserIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>; }
function EyeIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .638C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function EyeSlashIcon({ className }) { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>; }
