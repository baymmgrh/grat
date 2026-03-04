"""
User Manual Models
Stores documentation and help content for the ERP system
"""
from datetime import datetime
from models import db


class ManualCategory(db.Model):
    """Categories for organizing manual content"""
    __tablename__ = 'manual_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(50), nullable=True)  # Icon name for frontend
    order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    articles = db.relationship('ManualArticle', back_populates='category', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'icon': self.icon,
            'order': self.order,
            'is_active': self.is_active,
            'article_count': len([a for a in self.articles if a.is_published])
        }


class ManualArticle(db.Model):
    """Individual help articles/documentation"""
    __tablename__ = 'manual_articles'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('manual_categories.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), nullable=False)
    summary = db.Column(db.Text, nullable=True)  # Short description
    content = db.Column(db.Text, nullable=False)  # Markdown content
    order = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=True)
    view_count = db.Column(db.Integer, default=0)
    
    # Metadata
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = db.relationship('ManualCategory', back_populates='articles')
    author = db.relationship('User', backref='manual_articles')
    
    def to_dict(self, include_content=True):
        result = {
            'id': self.id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'title': self.title,
            'slug': self.slug,
            'summary': self.summary,
            'order': self.order,
            'is_published': self.is_published,
            'view_count': self.view_count,
            'author': self.author.full_name if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_content:
            result['content'] = self.content
        return result


class ManualFAQ(db.Model):
    """Frequently Asked Questions"""
    __tablename__ = 'manual_faqs'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('manual_categories.id'), nullable=True)
    question = db.Column(db.String(500), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=True)
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = db.relationship('ManualCategory', backref='faqs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'question': self.question,
            'answer': self.answer,
            'order': self.order,
            'is_published': self.is_published,
            'view_count': self.view_count
        }
