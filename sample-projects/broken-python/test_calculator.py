import pytest
from calculator import sum_positive, is_even, fahrenheit_to_celsius

def test_sum_positive_basic():
    assert sum_positive([1, 2, 3, 4]) == 10

def test_sum_positive_with_negatives():
    assert sum_positive([-1, 2, -3, 4]) == 6

def test_sum_positive_empty():
    assert sum_positive([]) == 0

def test_sum_positive_all_negative():
    assert sum_positive([-1, -2, -3]) == 0

def test_is_even_true():
    assert is_even(4) == True

def test_is_even_false():
    assert is_even(3) == False

def test_is_even_zero():
    assert is_even(0) == True

def test_fahrenheit_to_celsius():
    assert fahrenheit_to_celsius(32) == 0
    assert fahrenheit_to_celsius(212) == 100
