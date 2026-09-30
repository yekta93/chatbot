from .user import User
from .document import Document, ContractDocument, LetterDocument  # , Mail
from .group import Group, DocumentGroup, DatabaseGroup, DashboardGroup
from .log import TokenUsageLog

__beanie_models__ = [
    Document,
    ContractDocument,
    LetterDocument,
    Group,
    DocumentGroup,
    DatabaseGroup,
    DashboardGroup,
    User,
    TokenUsageLog,
]
