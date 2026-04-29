def uppercase(text):
    return text.upper()


def lowercase(text):
    return text.lower()


def reverse(text):
    return text[::-1]


def word_count(text):
    words = text.split()
    return str(len(words))


OPERATIONS = {
    'uppercase': uppercase,
    'lowercase': lowercase,
    'reverse': reverse,
    'word_count': word_count
}


def process_task(operation, input_text):
    if operation not in OPERATIONS:
        raise ValueError(f"Unknown operation: {operation}")

    result = OPERATIONS[operation](input_text)
    return result
