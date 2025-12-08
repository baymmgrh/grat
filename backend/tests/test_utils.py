"""
Tests for Utility Functions
"""
import pytest
from utils.i18n import get_message, error_response, success_response, i18n


def test_get_message():
    """Test translation function"""
    # Test with default language
    result = get_message('auth.invalid_credentials')
    assert isinstance(result, str)
    assert len(result) > 0


def test_error_response():
    """Test error response helper"""
    result = error_response('auth.invalid_credentials')
    assert isinstance(result, dict)
    assert 'error' in result or 'message' in result
    assert 'success' in result
    assert result['success'] is False


def test_success_response():
    """Test success response helper"""
    result = success_response('Operation successful')
    assert isinstance(result, dict)
    assert 'message' in result or 'success' in result
    assert result['success'] is True


def test_i18n_translate():
    """Test i18n translate method"""
    result = i18n.translate('auth.invalid_credentials')
    assert isinstance(result, str)
    assert len(result) > 0


def test_error_response_with_details():
    """Test error response with additional details"""
    result = error_response('auth.invalid_credentials', details={'field': 'username'})
    assert isinstance(result, dict)
    assert 'details' in result


def test_translation_fallback():
    """Test translation fallback for missing keys"""
    result = get_message('nonexistent.key.that.does.not.exist')
    assert isinstance(result, str)
    # Should return the key itself or a default message
    assert len(result) > 0
