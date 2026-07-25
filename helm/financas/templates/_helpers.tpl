{{- define "financas.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "financas.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name (include "financas.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "financas.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ include "financas.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "financas.selectorLabels" -}}
app.kubernetes.io/name: {{ include "financas.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "financas.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "financas.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{- define "financas.secretName" -}}
{{- default (printf "%s-secrets" (include "financas.fullname" .)) .Values.existingSecret.name }}
{{- end }}
