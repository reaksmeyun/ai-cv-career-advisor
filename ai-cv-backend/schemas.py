from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


ProfileLevel = Literal[
    "Student",
    "Internship Level",
    "Apprentice Level",
    "Entry Level",
    "Junior Level",
]

MatchLevel = Literal[
    "High",
    "Medium",
    "Developing",
]

PriorityLevel = Literal[
    "High",
    "Medium",
    "Low",
]

LearningLevel = Literal[
    "Beginner",
    "Intermediate",
    "Advanced",
]


class AnalyzeTextRequest(BaseModel):
    cvText: str = Field(
        min_length=100,
        max_length=12_000,
        description="Plain text extracted from a CV.",
    )


class RecommendedRole(BaseModel):
    title: str
    matchLevel: MatchLevel
    reason: str
    matchingSkills: list[str]
    missingSkills: list[str]


class MissingSkill(BaseModel):
    skill: str
    priority: PriorityLevel
    reason: str
    action: str


class LearningRecommendation(BaseModel):
    title: str
    level: LearningLevel
    reason: str
    action: str


class CVAnalysis(BaseModel):
    professionalSummary: str
    profileLevel: ProfileLevel
    technicalSkills: list[str]
    softSkills: list[str]
    recommendedRoles: list[RecommendedRole]
    missingSkills: list[MissingSkill]
    learningRecommendations: list[LearningRecommendation]


class AnalyzeFileResponse(BaseModel):
    filename: str
    fileType: str
    extractionMethod: str
    extractedCharacters: int
    analysis: CVAnalysis


class HealthResponse(BaseModel):
    status: str
    model: str
    device: str