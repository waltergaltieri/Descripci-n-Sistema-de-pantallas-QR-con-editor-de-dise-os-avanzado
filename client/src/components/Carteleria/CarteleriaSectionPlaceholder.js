import React from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';

const CarteleriaSectionPlaceholder = ({
  title,
  description,
  createLabel,
  highlights = [],
  helperTitle,
  helperDescription
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600 max-w-3xl">{description}</p>
        </div>

        <button type="button" className="btn btn-primary flex items-center self-start">
          <Plus className="h-4 w-4 mr-2 text-white" />
          <span className="text-white">{createLabel}</span>
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <label htmlFor={`${title}-section-search`} className="sr-only">
                Buscar en {title}
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id={`${title}-section-search`}
                  type="search"
                  className="input pl-9"
                  placeholder={`Buscar en ${title.toLowerCase()}...`}
                  readOnly
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-outline">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtros
              </button>
              <button type="button" className="btn btn-outline">
                Vista tabla
              </button>
              <button type="button" className="btn btn-outline">
                Vista tarjetas
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {highlights.map((highlight) => {
          const Icon = highlight.icon;

          return (
            <div key={highlight.title} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{highlight.title}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                      {highlight.value}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">{highlight.description}</p>
                  </div>

                  {Icon ? (
                    <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card border-blue-200 bg-blue-50/70">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-gray-900">{helperTitle}</h3>
          <p className="mt-2 text-sm text-gray-700">{helperDescription}</p>
        </div>
      </div>
    </div>
  );
};

export default CarteleriaSectionPlaceholder;
