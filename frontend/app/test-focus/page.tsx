"use client";

import React, { useState } from 'react';

export default function TestFocusPage() {
  const [value, setValue] = useState('');

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Input Focus Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Simple Input Test</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type here to test focus..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Table Input Test</label>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">Exercise</th>
                <th className="border border-gray-300 p-2">Week 1</th>
                <th className="border border-gray-300 p-2">Week 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">Chest Press</td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    placeholder="3 x 10"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    placeholder="3 x 10"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">T-bar</td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    placeholder="45s"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    placeholder="45s"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Try typing in the simple input above - it should work fine</li>
            <li>Try typing in the table inputs - this will show if the table structure is the problem</li>
            <li>If table inputs lose focus, the issue is with the table structure</li>
            <li>If both work fine, the issue is specific to the ProgramBuilder component</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 