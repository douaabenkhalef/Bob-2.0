def sum_positive(numbers):
    total = 0
    for i in range(len(numbers)):
        if numbers[i] > 0:
            total += numbers[i]
    return total


def is_even(n):
    return n % 2 == 0


def fahrenheit_to_celsius(f):
    return (f - 32) * 5 / 9
