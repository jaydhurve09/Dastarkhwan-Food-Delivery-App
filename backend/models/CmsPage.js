import { BaseModel } from './BaseModel.js';

export class CmsPage extends BaseModel {
  static collectionName = 'cmsPages';

  constructor(data = {}) {
    super();
    this.title = data.title || ''; // Required
    this.slug = data.slug || ''; // Required, unique
    this.content = data.content || ''; // Required
    this.metaTitle = data.metaTitle || '';
    this.metaDescription = data.metaDescription || '';
    this.metaKeywords = data.metaKeywords || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.pageType = data.pageType || 'static'; // 'static', 'dynamic', or 'system'
    this.template = data.template || '';
    this.featuredImage = data.featuredImage || '';
    this.authorId = data.authorId || null; // Reference to Admin
    this.lastUpdatedById = data.lastUpdatedById || null; // Reference to Admin
    this.publishedAt = data.publishedAt || new Date();
    this.viewCount = data.viewCount || 0;
    this.seo = data.seo || {
      canonicalUrl: '',
      schemaMarkup: {},
      openGraph: {
        title: '',
        description: '',
        image: '',
        type: 'website'
      },
      twitterCard: {
        title: '',
        description: '',
        image: '',
        card: 'summary_large_image'
      }
    };
    this.customFields = data.customFields || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      title: this.title,
      slug: this.slug.toLowerCase().trim(),
      content: this.content,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      metaKeywords: this.metaKeywords,
      isActive: this.isActive,
      pageType: this.pageType,
      template: this.template,
      featuredImage: this.featuredImage,
      authorId: this.authorId,
      lastUpdatedById: this.lastUpdatedById,
      publishedAt: this.publishedAt,
      viewCount: this.viewCount,
      seo: this.seo,
      customFields: this.customFields,
      updatedAt: new Date()
    };
  }

  // Validation method
  validate() {
    if (!this.title) throw new Error('Title is required');
    if (!this.slug) throw new Error('Slug is required');
    if (!this.content) throw new Error('Content is required');
    if (!this.authorId) throw new Error('Author ID is required');
    
    const validPageTypes = ['static', 'dynamic', 'system'];
    if (!validPageTypes.includes(this.pageType)) {
      throw new Error(`Invalid page type. Must be one of: ${validPageTypes.join(', ')}`);
    }
    
    return true;
  }

  // Static method to find by slug
  static async findBySlug(slug) {
    if (!slug) return null;
    const results = await this.find({
      where: { 
        slug: slug.toLowerCase().trim(),
        isActive: true
      },
      limit: 1
    });
    return results[0] || null;
  }

  // Method to increment view count
  async incrementViewCount() {
    this.viewCount = (this.viewCount || 0) + 1;
    return this.save();
  }

  // Method to get the URL for this page
  getUrl() {
    return `/pages/${this.slug}`;
  }

  // Helper to get author (requires Admin model)
  async getAuthor() {
    if (!this.authorId) return null;
    const { Admin } = await import('./Admin.js');
    return Admin.findById(this.authorId);
  }

  // Helper to get last updated by user
  async getLastUpdatedBy() {
    if (!this.lastUpdatedById) return null;
    const { Admin } = await import('./Admin.js');
    return Admin.findById(this.lastUpdatedById);
  }
}

// Export a singleton instance
export default new CmsPage();