# broken-python — off-by-one + wrong operator bug

def sum_positive(numbers):
    """Return the sum of all positive numbers in the list."""
    total = 0
    for i in range(len(numbers)):
        if numbers[i] > 0:
            total += numbers[i]
    return total


def is_even(n):
    """Return True if n is even."""
    return n % 2 == 0


def fahrenheit_to_celsius(f):
    """Convert Fahrenheit to Celsius."""
    return (f - 32) * 5 / 9  # correct — leave this alone
