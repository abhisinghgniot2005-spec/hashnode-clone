import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [publicBlogs, setPublicBlogs] = useState([]);
  const [loadingPublicBlogs, setLoadingPublicBlogs] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [loadingBlogs, setLoadingBlogs] = useState(false);

  // View Blog
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showViewBlog, setShowViewBlog] = useState(false);

  // Edit Blog
  const [showEditBlog, setShowEditBlog] = useState(false);

  // Create Blog
  const [showCreateBlog, setShowCreateBlog] = useState(false);
  const [creatingBlog, setCreatingBlog] = useState(false);

  // Login/Register form
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  // Create blog form
  const [blogForm, setBlogForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    tags: "",
    status: "published",
  });

  // Check login when app starts
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch published blogs for visitors
  useEffect(() => {
    const fetchPublicBlogs = async () => {
      try {
        const response = await fetch(
          "https://hashnode-clone-9r71.onrender.com/api/auth/login"
        );
        const data = await response.json();

        if (response.ok) {
          setPublicBlogs(data.blogs || []);
        } else {
          console.error(
            data.message || "Failed to fetch public blogs"
          );
        }
      } catch (error) {
        console.error("Failed to fetch public blogs:", error);
      } finally {
        setLoadingPublicBlogs(false);
      }
    };

    fetchPublicBlogs();
  }, []);

  // Fetch user's blogs
  useEffect(() => {
    if (isLoggedIn) {
      fetchMyBlogs();
    }
  }, [isLoggedIn]);

  // Fetch My Blogs
  const fetchMyBlogs = async () => {
    try {
      setLoadingBlogs(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://hashnode-clone-9r71.onrender.com/api/blogs/my",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      setBlogs(data.blogs || []);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // VIEW BLOG
  const handleViewBlog = async (id) => {
    try {
      const response = await fetch(
        `https://hashnode-clone-9r71.onrender.com/api/blogs/${id}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Blog fetch nahi ho paya.");
        return;
      }

      setSelectedBlog(data.blog);
      setShowViewBlog(true);
    } catch (error) {
      console.error(error);
      alert("Blog fetch karne mein problem aa gayi.");
    }
  };

  // Delete Blog
  const handleDeleteBlog = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this blog?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `https://hashnode-clone-9r71.onrender.com/api/blogs/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Blog delete nahi hua.");
        return;
      }

      alert("Blog deleted successfully!");
      await fetchMyBlogs();
    } catch (error) {
      console.error("Delete blog error:", error);
      alert("Server se connection nahi ho pa raha.");
    }
  };

  // Login/Register input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Login/Register submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const endpoint = isLogin
        ? "https://hashnode-clone-9r71.onrender.com/api/auth/login"
        : "https://hashnode-clone-9r71.onrender.com/api/auth/register";

      const body = isLogin
        ? {
            email: formData.email,
            password: formData.password,
          }
        : formData;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Something went wrong");
        return;
      }

      if (isLogin) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setIsLoggedIn(true);
        alert("Login successful!");
      } else {
        alert("Registration successful!");
        setIsLogin(true);

        setFormData({
          name: "",
          username: "",
          email: "",
          password: "",
        });
      }
    } catch (error) {
      console.error(error);
      alert("Server se connection nahi ho pa raha.");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setBlogs([]);
    setIsLoggedIn(false);
    setShowCreateBlog(false);
    setShowViewBlog(false);
    setShowEditBlog(false);
    setSelectedBlog(null);
  };

  // Create Blog input change
  const handleBlogChange = (e) => {
    setBlogForm({
      ...blogForm,
      [e.target.name]: e.target.value,
    });
  };

  // Open selected blog in edit form
  const handleEditBlog = (blog) => {
    setSelectedBlog(blog);

    setBlogForm({
      title: blog.title || "",
      content: blog.content || "",
      excerpt: blog.excerpt || "",
      tags: Array.isArray(blog.tags)
        ? blog.tags.join(", ")
        : "",
      status: blog.status || "draft",
    });

    setShowViewBlog(false);
    setShowCreateBlog(false);
    setShowEditBlog(true);
  };

  // Create / Update Blog
  const handleCreateBlog = async (e) => {
    e.preventDefault();

    if (!blogForm.title.trim() || !blogForm.content.trim()) {
      alert("Title and content are required.");
      return;
    }

    try {
      setCreatingBlog(true);
      const token = localStorage.getItem("token");

      const blogData = {
        title: blogForm.title,
        content: blogForm.content,
        excerpt: blogForm.excerpt,
        tags: blogForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== ""),
        status: blogForm.status,
      };

      const isEditing = showEditBlog;

      const endpoint = isEditing
        ? `https://hashnode-clone-9r71.onrender.com/api/blogs/${selectedBlog._id}`
        : "https://hashnode-clone-9r71.onrender.com/api/blogs";

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(blogData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Blog create nahi hua.");
        return;
      }

      alert(
        isEditing
          ? "Blog updated successfully!"
          : "Blog created successfully!"
      );

      setBlogForm({
        title: "",
        content: "",
        excerpt: "",
        tags: "",
        status: "published",
      });

      setShowCreateBlog(false);
      setShowEditBlog(false);
      setSelectedBlog(null);

      await fetchMyBlogs();
    } catch (error) {
      console.error(
        showEditBlog ? "Update blog error:" : "Create blog error:",
        error
      );
      alert("Server se connection nahi ho pa raha.");
    } finally {
      setCreatingBlog(false);
    }
  };

  // Search and tag filter logic
  const filteredPublicBlogs = publicBlogs.filter((blog) => {
    const query = searchText.trim().toLowerCase();

    const matchesSearch =
      !query ||
      blog.title?.toLowerCase().includes(query) ||
      blog.excerpt?.toLowerCase().includes(query) ||
      blog.content?.toLowerCase().includes(query) ||
      blog.tags?.some((tag) =>
        tag.toLowerCase().includes(query)
      );

    const matchesTag =
      !selectedTag ||
      blog.tags?.some(
        (tag) =>
          tag.toLowerCase() === selectedTag.toLowerCase()
      );

    return matchesSearch && matchesTag;
  });
    // DASHBOARD
  if (isLoggedIn) {
    return (
      <div className="dashboard">
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="dashboard-logo">
            Hashnode
          </div>

          <div className="header-right">
            <span>
              Hi, {user?.name || user?.username}
            </span>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          {showViewBlog && selectedBlog ? (
            <section className="view-blog-section">
              <button
                className="back-btn"
                onClick={() => {
                  setShowViewBlog(false);
                  setSelectedBlog(null);
                }}
              >
                ← Back to Blogs
              </button>

              <article className="full-blog">
                <div className="full-blog-top">
                  <span
                    className={
                      selectedBlog.status === "published"
                        ? "status published"
                        : "status draft"
                    }
                  >
                    {selectedBlog.status}
                  </span>

                  <span className="blog-date">
                    {new Date(
                      selectedBlog.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>

                <h1>{selectedBlog.title}</h1>

                {selectedBlog.excerpt && (
                  <p className="full-blog-excerpt">
                    {selectedBlog.excerpt}
                  </p>
                )}

                {selectedBlog.tags?.length > 0 && (
                  <div className="blog-tags">
                    {selectedBlog.tags.map((tag, index) => (
                      <span key={index}>#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="full-blog-content">
                  {selectedBlog.content}
                </div>
              </article>
            </section>
          ) : showCreateBlog || showEditBlog ? (
            <section className="create-blog-section">
              <div className="create-blog-header">
                <div>
                  <h1>
                    {showEditBlog ? "Edit Blog" : "Create New Blog"}
                  </h1>
                  <p>
                    Share your knowledge with the world.
                  </p>
                </div>

                <button
                  className="back-btn"
                  onClick={() => {
                    setShowCreateBlog(false);
                    setShowEditBlog(false);
                    setSelectedBlog(null);
                  }}
                >
                  ← Back
                </button>
              </div>

              <form
                className="create-blog-form"
                onSubmit={handleCreateBlog}
              >
                <label>Blog Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter your blog title"
                  value={blogForm.title}
                  onChange={handleBlogChange}
                  required
                />

                <label>Excerpt</label>
                <input
                  type="text"
                  name="excerpt"
                  placeholder="Short description of your blog"
                  value={blogForm.excerpt}
                  onChange={handleBlogChange}
                />

                <label>Content</label>
                <textarea
                  name="content"
                  placeholder="Write your blog content here..."
                  value={blogForm.content}
                  onChange={handleBlogChange}
                  rows="12"
                  required
                />

                <label>Tags</label>
                <input
                  type="text"
                  name="tags"
                  placeholder="React, Node.js, MongoDB"
                  value={blogForm.tags}
                  onChange={handleBlogChange}
                />

                <label>Status</label>
                <select
                  name="status"
                  value={blogForm.status}
                  onChange={handleBlogChange}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>

                <div className="create-blog-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowCreateBlog(false);
                      setShowEditBlog(false);
                      setSelectedBlog(null);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="publish-btn"
                    disabled={creatingBlog}
                  >
                    {creatingBlog
                      ? showEditBlog
                        ? "Updating..."
                        : "Creating..."
                      : showEditBlog
                        ? "Update Blog"
                        : "Create Blog"}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <>
              <div className="dashboard-welcome">
                <div>
                  <h1>
                    Welcome back, {user?.name} 👋
                  </h1>
                  <p>
                    Manage your blogs and share your knowledge.
                  </p>
                </div>

                <button
                  className="create-blog-btn"
                  onClick={() => {
                    setBlogForm({
                      title: "",
                      content: "",
                      excerpt: "",
                      tags: "",
                      status: "published",
                    });
                    setShowEditBlog(false);
                    setSelectedBlog(null);
                    setShowCreateBlog(true);
                  }}
                >
                  + Create Blog
                </button>
              </div>

              <section className="blogs-section">
                <div className="section-header">
                  <h2>My Blogs</h2>
                  <span>
                    {blogs.length}{" "}
                    {blogs.length === 1 ? "Blog" : "Blogs"}
                  </span>
                </div>

                {loadingBlogs ? (
                  <div className="empty-state">
                    Loading your blogs...
                  </div>
                ) : blogs.length === 0 ? (
                  <div className="empty-state">
                    <h3>No blogs yet</h3>
                    <p>
                      Start writing your first blog and share your knowledge.
                    </p>

                    <button
                      className="create-blog-btn"
                      onClick={() => {
                        setBlogForm({
                          title: "",
                          content: "",
                          excerpt: "",
                          tags: "",
                          status: "published",
                        });
                        setShowEditBlog(false);
                        setSelectedBlog(null);
                        setShowCreateBlog(true);
                      }}
                    >
                      Create Your First Blog
                    </button>
                  </div>
                ) : (
                  <div className="blog-grid">
                    {blogs.map((blog) => (
                      <article
                        className="blog-card"
                        key={blog._id}
                      >
                        <div className="blog-card-top">
                          <span
                            className={
                              blog.status === "published"
                                ? "status published"
                                : "status draft"
                            }
                          >
                            {blog.status}
                          </span>

                          <span className="blog-date">
                            {new Date(
                              blog.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <h3>{blog.title}</h3>

                        <p>
                          {blog.excerpt ||
                            blog.content?.substring(0, 120) + "..."}
                        </p>

                        <div className="blog-card-footer">
                          <button onClick={() => handleEditBlog(blog)}>
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleViewBlog(blog._id)
                            }
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteBlog(blog._id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    );
  }
    // LOGIN / REGISTER + PUBLIC BLOG FEED
  return (
    <div className="auth-container">
      <section
        className="public-feed"
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto 32px",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "8px" }}>
              Explore Published Blogs
            </h1>
            <p style={{ margin: 0 }}>
              Read stories and ideas from the Hashnode community.
            </p>
          </div>

          <button
            type="button"
            className="submit-btn"
            onClick={() => {
              setIsLogin(true);
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              });
            }}
          >
            Login to Write
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="blog-search">
          <input
            type="text"
            placeholder="Search blogs by title, content or tags..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          {(searchText || selectedTag) && (
            <button
              type="button"
              onClick={() => {
                setSearchText("");
                setSelectedTag("");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {loadingPublicBlogs ? (
          <p>Loading published blogs...</p>
        ) : filteredPublicBlogs.length === 0 ? (
          <p>No matching blogs found.</p>
        ) : (
          <div className="blog-grid">
            {filteredPublicBlogs.map((blog) => (
              <article
                className="blog-card"
                key={blog._id}
              >
                <div className="blog-card-top">
                  <span className="status published">
                    published
                  </span>

                  <span className="blog-date">
                    {blog.createdAt
                      ? new Date(blog.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>

                <h3>{blog.title}</h3>

                <p>
                  {blog.excerpt ||
                    (blog.content
                      ? blog.content.substring(0, 140) +
                        (blog.content.length > 140 ? "..." : "")
                      : "")}
                </p>

               
{blog.tags?.length > 0 && (
  <div className="blog-tags">
    {blog.tags.map((tag, index) => (
      <button
        type="button"
        key={`${tag}-${index}`}
        className="tag-filter-btn"
        onClick={() =>
          setSelectedTag((current) =>
            current.toLowerCase() === tag.toLowerCase()
              ? ""
              : tag
          )
        }
      >
        #{tag}
      </button>
    ))}
  </div>
)}


                <details style={{ marginTop: "12px" }}>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Read full blog
                  </summary>

                  <div
                    className="full-blog-content"
                    style={{
                      whiteSpace: "pre-wrap",
                      marginTop: "12px",
                    }}
                  >
                    {blog.content}
                  </div>
                </details>

                <p
                  style={{
                    fontSize: "13px",
                    opacity: 0.75,
                    marginTop: "12px",
                  }}
                >
                  By {blog.author?.name ||
                    blog.author?.username ||
                    "Hashnode user"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="auth-card">
        <div className="logo-section">
          <h1>Hashnode</h1>
          <p>
            Share your knowledge with the world.
          </p>
        </div>

        <div className="tabs">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>

          <button
            className={!isLogin ? "active" : ""}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="submit-btn"
          >
            {isLogin ? "Login" : "Create Account"}
          </button>
        </form>

        <p className="switch-text">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? " Register" : " Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default App;