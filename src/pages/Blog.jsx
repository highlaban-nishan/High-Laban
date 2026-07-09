import React, { useState, useEffect } from 'react';
import styles from './Blog.module.css';
import db from '../utils/db';
import { Helmet } from 'react-helmet-async';
import { FiX } from 'react-icons/fi';

const Blog = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBlog, setSelectedBlog] = useState(null);

    useEffect(() => {
        const fetchBlogs = async () => {
            const data = await db.getBlogs();
            setBlogs(data);
            setLoading(false);
        };
        fetchBlogs();
    }, []);

    const formatDate = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading amazing stories...</div>;

    return (
        <div className={styles.container}>
            <Helmet>
                <title>Blog | highlaban</title>
                <meta name="description" content="Read the latest stories, recipes, and news from highlaban." />
            </Helmet>

            <div className={styles.header}>
                <h1 className={styles.title}>Our Journal</h1>
                <p className={styles.subtitle}>Stories, sweet moments, and news from the highlaban family.</p>
            </div>

            <div className={styles.grid}>
                {blogs.map(blog => (
                    <div key={blog.id} className={styles.card} onClick={() => setSelectedBlog(blog)}>
                        <div className={styles.imageWrap}>
                            <img src={blog.image || 'https://via.placeholder.com/400x250?text=highlaban+Blog'} alt={blog.title} className={styles.image} />
                        </div>
                        <div className={styles.content}>
                            <span className={styles.tag}>{blog.tags || 'Lifestyle'}</span>
                            <h3 className={styles.blogTitle}>{blog.title}</h3>
                            <div className={styles.meta}>
                                <span className={styles.author}>By {blog.author || 'Admin'}</span>
                                <span>{formatDate(blog.date)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for reading full blog */}
            {selectedBlog && (
                <div className={styles.modalOverlay} onClick={() => setSelectedBlog(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setSelectedBlog(null)}><FiX /></button>
                        {selectedBlog.image && <img src={selectedBlog.image} alt={selectedBlog.title} className={styles.modalImage} />}
                        <div className={styles.modalBody}>
                            <h2 className={styles.modalTitle}>{selectedBlog.title}</h2>
                            <div className={styles.meta} style={{marginBottom: '2rem'}}>
                                <span className={styles.author}>By {selectedBlog.author || 'Admin'}</span>
                                <span>{formatDate(selectedBlog.date)}</span>
                            </div>
                            <div className={styles.modalText}>{selectedBlog.content}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Blog;
