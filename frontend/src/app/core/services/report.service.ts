import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReadingSummary } from '../models';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private base = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getSummary(
    stationIds: number[],
    from: string,
    to: string,
    metric?: string,
  ): Observable<ReadingSummary[]> {
    return this.http.post<ReadingSummary[]>(`${this.base}/reports/summary`, {
      station_ids: stationIds,
      from,
      to,
      metric,
    });
  }

  downloadCsv(
    stationId: number,
    from: string,
    to: string,
    metric?: string,
  ): Observable<Blob> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (metric) params = params.set('metric', metric);
    return this.http.get(`${this.base}/stations/${stationId}/export/csv`, {
      params,
      responseType: 'blob',
    });
  }

  downloadExcel(
    stationId: number,
    from: string,
    to: string,
    metric?: string,
  ): Observable<Blob> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (metric) params = params.set('metric', metric);
    return this.http.get(`${this.base}/stations/${stationId}/export/excel`, {
      params,
      responseType: 'blob',
    });
  }

  // Client-side Excel export from in-memory data
  exportToExcel(data: ReadingSummary[], filename: string): void {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EcoTrack Report');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  // Client-side PDF export
  exportToPdf(data: ReadingSummary[], title: string, filename: string): void {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [['Station ID', 'Metric', 'Unit', 'Date', 'Avg', 'Min', 'Max']],
      body: data.map((r) => [
        r.station_id,
        r.metric,
        r.unit,
        r.date,
        r.avg.toFixed(2),
        r.min.toFixed(2),
        r.max.toFixed(2),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [21, 101, 192] },
    });

    doc.save(`${filename}.pdf`);
  }
}
