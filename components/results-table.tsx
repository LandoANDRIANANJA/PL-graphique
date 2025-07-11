"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { SolutionMethod } from '@/app/page'
import type { SimplexIteration } from '@/lib/lp-solver'

type TableData = {
  tableData: {
    headers: string[]
    rows: string[][]
  }
  method: SolutionMethod
  iterations?: SimplexIteration[]
}

export function ResultsTable({ tableData, method, iterations }: TableData) {
  const { headers, rows } = tableData
  
  if (!headers.length || !rows.length) {
    return null
  }

  // Pour la méthode simplexe, afficher toutes les itérations
  if (method === 'simplex' && iterations) {
    return (
      <div className="space-y-6">
        {iterations.map((iteration, index) => (
          <Card key={index} className="modern-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"></div>
                <h3 className="text-xl font-bold gradient-text">
                  {index === 0 ? 'Tableau Initial du Simplexe' : `Itération ${iteration.iteration}`}
                </h3>
              </div>
              {iteration.isOptimal && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Solution Optimale
                </Badge>
              )}
            </div>

            {/* Informations sur l'itération */}
            {iteration.pivot && (
              <div className="mb-4 p-4 glass-effect rounded-xl border border-blue-500/20">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-300 font-medium">Variable entrante:</span>
                    <p className="text-green-400 font-mono">{iteration.enteringVariable}</p>
                  </div>
                  <div>
                    <span className="text-blue-300 font-medium">Variable sortante:</span>
                    <p className="text-red-400 font-mono">{iteration.leavingVariable}</p>
                  </div>
                  <div>
                    <span className="text-blue-300 font-medium">Pivot:</span>
                    <p className="text-yellow-400 font-mono">
                      Ligne {iteration.pivot.row + 1}, Colonne {iteration.pivot.col + 1}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tableau simplexe */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-blue-500/30">
                    <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                      Ci
                    </TableHead>
                    <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                      i
                    </TableHead>
                    {Array.from({ length: iteration.tableau[0].length }, (_, i) => (
                      <TableHead key={i} className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                        A{i + 1}
                      </TableHead>
                    ))}
                    {iteration.ratios && (
                      <TableHead className="text-center font-bold text-orange-300 bg-orange-900/20">
                        xi / xij
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Lignes des contraintes */}
                  {iteration.tableau.slice(0, -2).map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="hover:bg-blue-500/10 border-b border-blue-500/20">
                      <TableCell className="text-center text-white font-mono bg-blue-900/10 border-r border-blue-500/20">
                        0
                      </TableCell>
                      <TableCell className="text-center text-cyan-300 font-mono bg-blue-900/10 border-r border-blue-500/20">
                        {iteration.basis[rowIndex]}
                      </TableCell>
                      {row.map((cell, cellIndex) => (
                        <TableCell 
                          key={cellIndex} 
                          className={`text-center font-mono border-r border-blue-500/20 ${
                            iteration.pivot && 
                            iteration.pivot.row === rowIndex && 
                            iteration.pivot.col === cellIndex
                              ? 'bg-yellow-500/20 text-yellow-300 font-bold'
                              : 'text-white bg-blue-900/10'
                          }`}
                        >
                          {cell.toFixed(2)}
                        </TableCell>
                      ))}
                      {iteration.ratios && (
                        <TableCell className="text-center text-orange-300 font-mono bg-orange-900/10">
                          {iteration.ratios[rowIndex] === Infinity ? '∞' : iteration.ratios[rowIndex].toFixed(2)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  
                  {/* Ligne Cj */}
                  <TableRow className="bg-green-900/20 border-b border-green-500/30">
                    <TableCell className="text-center text-green-300 font-bold border-r border-blue-500/20">
                      Cj
                    </TableCell>
                    <TableCell className="text-center border-r border-blue-500/20"></TableCell>
                    {iteration.tableau[iteration.tableau.length - 2].map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="text-center text-green-300 font-mono border-r border-blue-500/20">
                        {cell.toFixed(2)}
                      </TableCell>
                    ))}
                    {iteration.ratios && (
                      <TableCell className="text-center border-r border-blue-500/20"></TableCell>
                    )}
                  </TableRow>
                  
                  {/* Ligne Δj */}
                  <TableRow className="bg-purple-900/20">
                    <TableCell className="text-center text-purple-300 font-bold border-r border-blue-500/20">
                      Δj
                    </TableCell>
                    <TableCell className="text-center border-r border-blue-500/20"></TableCell>
                    {iteration.tableau[iteration.tableau.length - 1].map((cell, cellIndex) => (
                      <TableCell 
                        key={cellIndex} 
                        className={`text-center font-mono border-r border-blue-500/20 ${
                          cell > 0 ? 'text-red-300 font-bold' : 'text-purple-300'
                        }`}
                      >
                        {cell.toFixed(2)}
                      </TableCell>
                    ))}
                    {iteration.ratios && (
                      <TableCell className="text-center border-r border-blue-500/20"></TableCell>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Explication des étapes */}
            {iteration.pivot && !iteration.isOptimal && (
              <div className="mt-4 p-4 glass-effect rounded-xl border border-blue-500/20">
                <h4 className="text-lg font-semibold mb-2 text-blue-300">📝 Étapes de calcul</h4>
                <div className="space-y-2 text-sm text-blue-200/80">
                  <p><strong>F1:</strong> Nouvelle valeur de la ligne i: x_ir = x_ir/a_ij, x_i = x_i/a_ij</p>
                  <p><strong>F2:</strong> Nouvelles valeurs des autres lignes: x_kr = x_kr - x_kj(x_ir/a_ij)</p>
                  <p><strong>F3:</strong> Nouvelle valeur de la fonction économique: Z = Z + (x_i/a_ij) Δj</p>
                </div>
              </div>
            )}

            {iteration.isOptimal && (
              <div className="mt-4 p-4 glass-effect rounded-xl border border-green-500/20">
                <h4 className="text-lg font-semibold mb-2 text-green-400">✅ Solution Optimale Atteinte</h4>
                <p className="text-sm text-green-300/80">
                  Tous les coefficients Δj sont négatifs ou nuls. La solution optimale est trouvée.
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    )
  }

  // Pour la méthode graphique, on utilise un format spécial basé sur l'image
  if (method === 'graphical') {
    return (
      <Card className="modern-card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"></div>
          <h2 className="text-2xl font-bold gradient-text">
            Résolution graphique - Tableau des Points
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-blue-500/30">
                <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                  Contraintes
                </TableHead>
                <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                  Équations des droites
                </TableHead>
                <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                  Point 1
                </TableHead>
                <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                  Point 2
                </TableHead>
                <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20">
                  Point 3
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-blue-500/10 border-b border-blue-500/20">
                  <TableCell className="text-center text-white font-mono bg-blue-900/10 border-r border-blue-500/20 font-medium">
                    {row[0]}
                  </TableCell>
                  <TableCell className="text-center text-cyan-300 font-mono bg-blue-900/10 border-r border-blue-500/20">
                    {row[1]}
                  </TableCell>
                  <TableCell className="text-center text-green-300 font-mono bg-blue-900/10 border-r border-blue-500/20">
                    {row[2]}
                  </TableCell>
                  <TableCell className="text-center text-green-300 font-mono bg-blue-900/10 border-r border-blue-500/20">
                    {row[3] || '-'}
                  </TableCell>
                  <TableCell className="text-center text-green-300 font-mono bg-blue-900/10">
                    {row[4] || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 p-4 glass-effect rounded-xl border border-blue-500/20">
          <h3 className="text-lg font-semibold mb-2 text-blue-300">📝 Explication</h3>
          <p className="text-sm text-blue-200/80">
            Ce tableau présente les contraintes du problème, leurs équations de droites correspondantes, 
            et les points d'intersection calculés pour déterminer la région réalisable.
          </p>
        </div>
      </Card>
    )
  }

  // Format standard pour les autres méthodes
  return (
    <Card className="modern-card p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"></div>
        <h2 className="text-2xl font-bold gradient-text">
          {method === 'simplex' ? 'Tableau du Simplexe' : 
           method === 'general' ? 'Résultats Forme Générale' : 'Tableau des Résultats'}
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index} className="text-center whitespace-nowrap text-blue-300 font-semibold">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-blue-500/10">
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} className="text-center text-white font-mono">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}