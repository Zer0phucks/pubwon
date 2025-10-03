/**
 * ICP Persona Display and Edit Component
 * Phase 3.3: ICP Persona Display UI
 */
'use client';

import { useState } from 'react';
import type { ICPPersona } from '@/types';

interface PersonaDisplayProps {
  persona: ICPPersona;
  onUpdate?: (updates: Partial<ICPPersona>) => void;
  editable?: boolean;
}

export function PersonaDisplay({ persona, onUpdate, editable = false }: PersonaDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPersona, setEditedPersona] = useState(persona);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedPersona);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPersona(persona);
    setIsEditing(false);
  };

  const updateField = (field: keyof ICPPersona, value: any) => {
    setEditedPersona((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateArrayField = (field: keyof ICPPersona, value: string) => {
    const items = value.split(',').map((item) => item.trim()).filter(Boolean);
    updateField(field, items);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          {isEditing ? (
            <input
              type="text"
              value={editedPersona.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-900">{persona.name}</h2>
          )}
          <p className="text-sm text-gray-500 mt-1">Ideal Customer Profile</p>
        </div>
        {editable && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Demographics */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Demographics</h3>
          <div className="space-y-2 text-sm">
            {persona.demographics.ageRange && (
              <div>
                <span className="text-gray-600">Age Range:</span>{' '}
                <span className="text-gray-900">{persona.demographics.ageRange}</span>
              </div>
            )}
            {persona.demographics.occupation && persona.demographics.occupation.length > 0 && (
              <div>
                <span className="text-gray-600">Occupation:</span>{' '}
                <span className="text-gray-900">{persona.demographics.occupation.join(', ')}</span>
              </div>
            )}
            {persona.demographics.experience && (
              <div>
                <span className="text-gray-600">Experience:</span>{' '}
                <span className="text-gray-900">{persona.demographics.experience}</span>
              </div>
            )}
            {persona.demographics.companySize && (
              <div>
                <span className="text-gray-600">Company Size:</span>{' '}
                <span className="text-gray-900">{persona.demographics.companySize}</span>
              </div>
            )}
          </div>
        </div>

        {/* Technical Skills */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Technical Skills</h3>
          <div className="flex flex-wrap gap-2">
            {persona.technicalSkills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Goals</h3>
          <ul className="space-y-2">
            {persona.goals.map((goal, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{goal}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pain Points */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Pain Points</h3>
          <ul className="space-y-2">
            {persona.painPoints.map((pain, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-0.5">⚠</span>
                <span>{pain}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Motivations */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Motivations</h3>
          <ul className="space-y-2">
            {persona.motivations.map((motivation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-purple-500 mt-0.5">💡</span>
                <span>{motivation}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Use Cases */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Use Cases</h3>
          <ul className="space-y-2">
            {persona.useCases.map((useCase, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-500 mt-0.5">📋</span>
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Preferred Platforms */}
        <div className="md:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-3">Preferred Platforms</h3>
          <div className="flex flex-wrap gap-2">
            {persona.preferredPlatforms.map((platform, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-lg"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
