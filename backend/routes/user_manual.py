"""
User Manual Routes
API endpoints for documentation and help system
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.user import User
from models.user_manual import ManualCategory, ManualArticle, ManualFAQ
from sqlalchemy import or_

manual_bp = Blueprint('manual', __name__)


# ==================== CATEGORIES ====================

@manual_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all manual categories"""
    try:
        categories = ManualCategory.query.filter_by(is_active=True).order_by(ManualCategory.order).all()
        return jsonify({
            'success': True,
            'categories': [cat.to_dict() for cat in categories]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@manual_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Create a new category (admin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Generate slug from name
        slug = data['name'].lower().replace(' ', '-').replace('/', '-')
        
        # Check if slug exists
        existing = ManualCategory.query.filter_by(slug=slug).first()
        if existing:
            slug = f"{slug}-{ManualCategory.query.count() + 1}"
        
        category = ManualCategory(
            name=data['name'],
            slug=slug,
            description=data.get('description'),
            icon=data.get('icon', 'BookOpenIcon'),
            order=data.get('order', 0)
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@manual_bp.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Update a category (admin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        category = ManualCategory.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            category.name = data['name']
        if 'description' in data:
            category.description = data['description']
        if 'icon' in data:
            category.icon = data['icon']
        if 'order' in data:
            category.order = data['order']
        if 'is_active' in data:
            category.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Category updated successfully',
            'category': category.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@manual_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Delete a category (admin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        category = ManualCategory.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Category deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== ARTICLES ====================

@manual_bp.route('/articles', methods=['GET'])
@jwt_required()
def get_articles():
    """Get all articles, optionally filtered by category"""
    try:
        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search', '')
        
        query = ManualArticle.query.filter_by(is_published=True)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if search:
            query = query.filter(
                or_(
                    ManualArticle.title.ilike(f'%{search}%'),
                    ManualArticle.summary.ilike(f'%{search}%'),
                    ManualArticle.content.ilike(f'%{search}%')
                )
            )
        
        articles = query.order_by(ManualArticle.order).all()
        
        return jsonify({
            'success': True,
            'articles': [article.to_dict(include_content=False) for article in articles]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@manual_bp.route('/articles/<int:article_id>', methods=['GET'])
@jwt_required()
def get_article(article_id):
    """Get a single article by ID"""
    try:
        article = ManualArticle.query.get(article_id)
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        # Increment view count
        article.view_count += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'article': article.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@manual_bp.route('/articles/slug/<string:slug>', methods=['GET'])
@jwt_required()
def get_article_by_slug(slug):
    """Get a single article by slug"""
    try:
        article = ManualArticle.query.filter_by(slug=slug, is_published=True).first()
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        # Increment view count
        article.view_count += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'article': article.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@manual_bp.route('/articles', methods=['POST'])
@jwt_required()
def create_article():
    """Create a new article (admin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Generate slug from title
        slug = data['title'].lower().replace(' ', '-').replace('/', '-')
        
        # Check if slug exists
        existing = ManualArticle.query.filter_by(slug=slug).first()
        if existing:
            slug = f"{slug}-{ManualArticle.query.count() + 1}"
        
        article = ManualArticle(
            category_id=data['category_id'],
            title=data['title'],
            slug=slug,
            summary=data.get('summary'),
            content=data['content'],
            order=data.get('order', 0),
            is_published=data.get('is_published', True),
            author_id=current_user_id
        )
        
        db.session.add(article)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Article created successfully',
            'article': article.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@manual_bp.route('/articles/<int:article_id>', methods=['PUT'])
@jwt_required()
def update_article(article_id):
    """Update an article (admin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        article = ManualArticle.query.get(article_id)
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        data = request.get_json()
        
        if 'category_id' in data:
            article.category_id = data['category_id']
        if 'title' in data:
            article.title = data['title']
        if 'summary' in data:
            article.summary = data['summary']
        if 'content' in data:
            article.content = data['content']
        if 'order' in data:
            article.order = data['order']
        if 'is_published' in data:
            article.is_published = data['is_published']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Article updated successfully',
            'article': article.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@manual_bp.route('/articles/<int:article_id>', methods=['DELETE'])
@jwt_required()
def delete_article(article_id):
    """Delete an article (admin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        article = ManualArticle.query.get(article_id)
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        db.session.delete(article)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Article deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== FAQ ====================

@manual_bp.route('/faqs', methods=['GET'])
@jwt_required()
def get_faqs():
    """Get all FAQs"""
    try:
        category_id = request.args.get('category_id', type=int)
        
        query = ManualFAQ.query.filter_by(is_published=True)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        faqs = query.order_by(ManualFAQ.order).all()
        
        return jsonify({
            'success': True,
            'faqs': [faq.to_dict() for faq in faqs]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@manual_bp.route('/faqs', methods=['POST'])
@jwt_required()
def create_faq():
    """Create a new FAQ (admin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        faq = ManualFAQ(
            category_id=data.get('category_id'),
            question=data['question'],
            answer=data['answer'],
            order=data.get('order', 0),
            is_published=data.get('is_published', True)
        )
        
        db.session.add(faq)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'FAQ created successfully',
            'faq': faq.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@manual_bp.route('/faqs/<int:faq_id>', methods=['PUT'])
@jwt_required()
def update_faq(faq_id):
    """Update a FAQ (admin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        faq = ManualFAQ.query.get(faq_id)
        if not faq:
            return jsonify({'error': 'FAQ not found'}), 404
        
        data = request.get_json()
        
        if 'category_id' in data:
            faq.category_id = data['category_id']
        if 'question' in data:
            faq.question = data['question']
        if 'answer' in data:
            faq.answer = data['answer']
        if 'order' in data:
            faq.order = data['order']
        if 'is_published' in data:
            faq.is_published = data['is_published']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'FAQ updated successfully',
            'faq': faq.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@manual_bp.route('/faqs/<int:faq_id>', methods=['DELETE'])
@jwt_required()
def delete_faq(faq_id):
    """Delete a FAQ (admin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        faq = ManualFAQ.query.get(faq_id)
        if not faq:
            return jsonify({'error': 'FAQ not found'}), 404
        
        db.session.delete(faq)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'FAQ deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== SEARCH ====================

@manual_bp.route('/search', methods=['GET'])
@jwt_required()
def search_manual():
    """Search across all manual content"""
    try:
        query = request.args.get('q', '')
        
        if not query or len(query) < 2:
            return jsonify({
                'success': True,
                'results': []
            }), 200
        
        # Search articles
        articles = ManualArticle.query.filter(
            ManualArticle.is_published == True,
            or_(
                ManualArticle.title.ilike(f'%{query}%'),
                ManualArticle.summary.ilike(f'%{query}%'),
                ManualArticle.content.ilike(f'%{query}%')
            )
        ).limit(10).all()
        
        # Search FAQs
        faqs = ManualFAQ.query.filter(
            ManualFAQ.is_published == True,
            or_(
                ManualFAQ.question.ilike(f'%{query}%'),
                ManualFAQ.answer.ilike(f'%{query}%')
            )
        ).limit(10).all()
        
        results = []
        
        for article in articles:
            results.append({
                'type': 'article',
                'id': article.id,
                'title': article.title,
                'summary': article.summary,
                'category': article.category.name if article.category else None,
                'slug': article.slug
            })
        
        for faq in faqs:
            results.append({
                'type': 'faq',
                'id': faq.id,
                'title': faq.question,
                'summary': faq.answer[:200] + '...' if len(faq.answer) > 200 else faq.answer,
                'category': faq.category.name if faq.category else None
            })
        
        return jsonify({
            'success': True,
            'query': query,
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== STATS ====================

@manual_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_manual_stats():
    """Get manual statistics (admin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        total_categories = ManualCategory.query.filter_by(is_active=True).count()
        total_articles = ManualArticle.query.filter_by(is_published=True).count()
        total_faqs = ManualFAQ.query.filter_by(is_published=True).count()
        
        # Most viewed articles
        popular_articles = ManualArticle.query.filter_by(is_published=True).order_by(
            ManualArticle.view_count.desc()
        ).limit(5).all()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_categories': total_categories,
                'total_articles': total_articles,
                'total_faqs': total_faqs,
                'popular_articles': [
                    {'id': a.id, 'title': a.title, 'views': a.view_count}
                    for a in popular_articles
                ]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
